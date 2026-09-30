import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ApiError, apiFetch, type ListResponse } from './api';
import { apiFetchServer } from './api.server';
import { loadList, loadOne, PUBLIC_REVALIDATE_SECONDS } from './loaders';
import { type MediaFilters, mediaListQuery, normalizeMediaItem } from './media-library';
import { SESSION_COOKIE } from './session';
import type { MediaCollection, MediaHome, MediaItem, MediaRow, MediaViewer } from './types';

/**
 * Server-side loaders for the media library. Like `loaders.ts` they never throw on an
 * unreachable API: the library page degrades to the plain grid, a detail page drops the
 * related shelf, and a build with the API down still succeeds. Server components only.
 */

const REVALIDATE = { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } };

function normalizeAll(items: MediaItem[] | undefined): MediaItem[] {
  return (items ?? []).map(normalizeMediaItem);
}

function normalizeRow(row: MediaRow): MediaRow {
  return { ...row, items: normalizeAll(row.items) };
}

function normalizeCollection(collection: MediaCollection): MediaCollection {
  return { ...collection, items: normalizeAll(collection.items) };
}

/** `null` when the home endpoint is missing, broken, or unreachable: the page then shows the grid alone. */
export async function loadMediaHome(): Promise<MediaHome | null> {
  try {
    const data = await apiFetch<MediaHome>('/media/home', REVALIDATE);
    return {
      hero: normalizeAll(data.hero),
      rows: (data.rows ?? []).map(normalizeRow).filter((row) => row.items.length > 0),
    };
  } catch {
    return null;
  }
}

export type MediaPage = { items: MediaItem[]; nextCursor: string | null; unavailable: boolean };

export async function loadMediaPage(filters: MediaFilters): Promise<MediaPage> {
  try {
    const query = mediaListQuery(filters).toString();
    const data = await apiFetch<ListResponse<MediaItem>>(`/media?${query}`, REVALIDATE);
    return {
      items: normalizeAll(data.items),
      nextCursor: data.nextCursor ?? null,
      unavailable: false,
    };
  } catch {
    return { items: [], nextCursor: null, unavailable: true };
  }
}

export type MediaDetail = {
  item: MediaItem | null;
  /** Present only when the request carried a session the API accepted. */
  viewer: MediaViewer | null;
  signedIn: boolean;
};

type DetailEnvelope = { media: MediaItem; viewer?: MediaViewer };

/**
 * `GET /api/media/:slug`, with the session forwarded when there is one so the answer carries
 * `viewer`. A stale cookie falls back to the public read rather than failing the page.
 * Memoized per request so `generateMetadata` and the page share one call.
 */
export const loadMediaDetail = cache(async (slug: string): Promise<MediaDetail> => {
  const path = `/media/${encodeURIComponent(slug)}`;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      const data = await apiFetch<DetailEnvelope>(path, { token, cache: 'no-store' });
      return {
        item: normalizeMediaItem(data.media),
        viewer: data.viewer ?? null,
        signedIn: true,
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) notFound();
      if (!(error instanceof ApiError && (error.status === 401 || error.status === 403))) {
        return { item: null, viewer: null, signedIn: false };
      }
    }
  }

  const item = await loadOne<MediaItem>(path, 'media');
  return { item: item ? normalizeMediaItem(item) : null, viewer: null, signedIn: false };
});

/** `null` when the related endpoint fails for any reason; the shelf is simply omitted. */
export async function loadRelated(slug: string): Promise<MediaItem[] | null> {
  try {
    const data = await apiFetch<{ items: MediaItem[] }>(
      `/media/${encodeURIComponent(slug)}/related`,
      REVALIDATE,
    );
    const items = normalizeAll(data.items);
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

export async function loadCollection(slug: string): Promise<MediaCollection | null> {
  const collection = await loadOne<MediaCollection>(
    `/media/collections/${encodeURIComponent(slug)}`,
    'collection',
  );
  return collection ? normalizeCollection(collection) : null;
}

export async function loadCollections(): Promise<MediaCollection[]> {
  const { items } = await loadList<MediaCollection>('/media/collections');
  return items.map(normalizeCollection);
}

const FEED_PAGE_LIMIT = 100;
const FEED_MAX_PAGES = 20;

/** Every published item, for the sitemap and llms.txt. Empty when the API is down. */
export async function loadAllMedia(): Promise<MediaItem[]> {
  const items: MediaItem[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < FEED_MAX_PAGES; page += 1) {
    try {
      const params = new URLSearchParams({ limit: String(FEED_PAGE_LIMIT), sort: 'title' });
      if (cursor) params.set('cursor', cursor);
      const data: ListResponse<MediaItem> = await apiFetch(
        `/media?${params.toString()}`,
        REVALIDATE,
      );
      items.push(...normalizeAll(data.items));
      cursor = data.nextCursor ?? null;
      if (!cursor) break;
    } catch {
      break;
    }
  }
  return items;
}

/** The member's saved list. Session required; the app layout has already validated it. */
export async function loadWatchlist(): Promise<MediaPage> {
  try {
    const data = await apiFetchServer<ListResponse<MediaItem>>('/me/watchlist');
    return {
      items: normalizeAll(data.items),
      nextCursor: data.nextCursor ?? null,
      unavailable: false,
    };
  } catch {
    return { items: [], nextCursor: null, unavailable: true };
  }
}
