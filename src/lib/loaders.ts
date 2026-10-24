import { notFound } from 'next/navigation';
import { ApiError, apiFetch, type ListResponse } from './api';

/**
 * Loaders for public, unauthenticated pages. They never throw on an unreachable API so a
 * build or a request with the API down renders an honest empty state instead of a 500.
 * Server components only.
 */

export const PUBLIC_REVALIDATE_SECONDS = 60;

export type LoadedList<T> = { items: T[]; unavailable: boolean };

export async function loadList<T>(path: string): Promise<LoadedList<T>> {
  try {
    const data = await apiFetch<ListResponse<T>>(path, {
      next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
    });
    return { items: data.items ?? [], unavailable: false };
  } catch {
    return { items: [], unavailable: true };
  }
}

/**
 * Resolves to the resource, calls `notFound()` on a 404, and `null` when the API is down.
 * Single resources come wrapped in a named envelope (`{ place: {...} }`, `{ event: {...} }`);
 * `key` names it. A bare object is accepted too, so a route that answers unwrapped still works.
 */
export async function loadOne<T extends { id: string }>(
  path: string,
  key: string,
): Promise<T | null> {
  const loaded = await loadOneStatus<T>(path, key);
  if (loaded.status === 'missing') notFound();
  return loaded.status === 'ok' ? loaded.item : null;
}

export type LoadedOne<T> =
  | { status: 'ok'; item: T }
  | { status: 'gone' }
  | { status: 'missing' }
  | { status: 'unavailable' };

/**
 * Like `loadOne`, but the caller decides what a 404 and a 410 mean. A 410 is a retired
 * public entry (creators). Anything else that is not a resource is the API being down,
 * including a 404 on a list-shaped route that has not been deployed yet.
 */
export async function loadOneStatus<T extends { id: string }>(
  path: string,
  key: string,
): Promise<LoadedOne<T>> {
  try {
    const data = await apiFetch<Record<string, unknown> | null>(path, {
      next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
    });
    if (!data || typeof data !== 'object') return { status: 'unavailable' };
    const wrapped = data[key];
    if (wrapped && typeof wrapped === 'object') return { status: 'ok', item: wrapped as T };
    if (typeof data.id === 'string') return { status: 'ok', item: data as unknown as T };
    return { status: 'unavailable' };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { status: 'missing' };
    if (error instanceof ApiError && error.status === 410) return { status: 'gone' };
    return { status: 'unavailable' };
  }
}

const PAGE_LIMIT = 100;
const MAX_PAGES = 20;

async function fetchPage<T>(
  pathname: string,
  params: URLSearchParams,
): Promise<{ items: T[]; nextCursor: string | null }> {
  const data = await apiFetch<ListResponse<T> | null>(`${pathname}?${params.toString()}`, {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  });
  const items = data && Array.isArray(data.items) ? data.items : [];
  const nextCursor =
    data && typeof data.nextCursor === 'string' && data.nextCursor ? data.nextCursor : null;
  return { items, nextCursor };
}

/**
 * Follows a cursor until the API says stop. The first page failing (404 from an endpoint
 * that is not deployed yet, or the API being down) is an empty unavailable list. A later
 * page failing keeps what already arrived.
 */
export async function loadPages<T>(path: string): Promise<LoadedList<T>> {
  const items: T[] = [];
  let cursor: string | null = null;
  const [pathname, existingQuery] = path.split('?');
  const base = new URLSearchParams(existingQuery ?? '');

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams(base);
    params.set('limit', String(PAGE_LIMIT));
    if (cursor) params.set('cursor', cursor);
    try {
      const batch = await fetchPage<T>(pathname ?? path, params);
      items.push(...batch.items);
      cursor = batch.nextCursor;
      if (!cursor) return { items, unavailable: false };
    } catch {
      return page === 0 ? { items: [], unavailable: true } : { items, unavailable: false };
    }
  }
  return { items, unavailable: false };
}
