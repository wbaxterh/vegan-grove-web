import { MEDIA_KIND_LABELS } from './labels';
import type { MediaItem, MediaKind, WatchAccess, WatchLink } from './types';

/**
 * Shared rules for the media library (media contract, section 10). Everything here runs on
 * the server and in the browser: URL state, formatting, and the defensive normalisation of a
 * record. Nothing here talks to the network.
 */

export const MEDIA_KIND_ORDER: readonly MediaKind[] = [
  'documentary',
  'film',
  'series',
  'talk',
  'short',
];

/** The topic vocabulary, in the order the home rows use it. */
export const MEDIA_TOPIC_TAGS = [
  'ethics',
  'health',
  'environment',
  'activism',
  'investigation',
] as const;

export const JUSTWATCH_TAG = 'Watch providers data by JustWatch';

/** Attribution tags ride along in `tags`; they are rendered as text, never as chips. */
const ATTRIBUTION_TAGS = new Set<string>(['tmdb', JUSTWATCH_TAG]);

export function topicTags(item: Pick<MediaItem, 'tags'>): string[] {
  return item.tags.filter((tag) => !ATTRIBUTION_TAGS.has(tag));
}

export function hasJustWatchAttribution(item: Pick<MediaItem, 'tags'>): boolean {
  return item.tags.includes(JUSTWATCH_TAG);
}

export type MediaSort = 'featured' | 'release' | 'title' | 'rating' | 'runtime';

export const MEDIA_SORT_OPTIONS: ReadonlyArray<{ value: MediaSort; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'release', label: 'Newest release' },
  { value: 'title', label: 'Title A to Z' },
  { value: 'rating', label: 'Top rated' },
  { value: 'runtime', label: 'Shortest first' },
];

const SORT_SET = new Set<string>(MEDIA_SORT_OPTIONS.map((option) => option.value));
const KIND_SET = new Set<string>(MEDIA_KIND_ORDER);

/**
 * Library filters live in the URL so a filtered view can be shared:
 *
 *   ?q=dairy&kind=documentary&tag=ethics&sort=release
 *
 * A default never appears in the query, so the plain `/media` URL stays canonical. With any
 * filter set the page shows the browse grid only (contract 10.3).
 */
export type MediaFilters = {
  q: string;
  kind: MediaKind | null;
  tag: string | null;
  sort: MediaSort;
};

export const DEFAULT_MEDIA_FILTERS: MediaFilters = {
  q: '',
  kind: null,
  tag: null,
  sort: 'featured',
};

/** The API accepts 2 to 80 characters; anything shorter is treated as no search. */
export function normalizeQuery(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim().slice(0, 80);
  return trimmed.length >= 2 ? trimmed : '';
}

export function parseMediaFilters(params: URLSearchParams): MediaFilters {
  const kind = params.get('kind');
  const sort = params.get('sort');
  const tag = params.get('tag')?.trim().slice(0, 40) ?? '';
  return {
    q: normalizeQuery(params.get('q')),
    kind: kind && KIND_SET.has(kind) ? (kind as MediaKind) : null,
    tag: tag ? tag : null,
    sort: sort && SORT_SET.has(sort) ? (sort as MediaSort) : 'featured',
  };
}

/** Query string without the `?`; empty when everything is at its default. */
export function serializeMediaFilters(filters: MediaFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.kind) params.set('kind', filters.kind);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.sort !== 'featured') params.set('sort', filters.sort);
  return params.toString();
}

export function mediaFiltersActive(filters: MediaFilters): boolean {
  return serializeMediaFilters(filters) !== '';
}

export function mediaHref(filters: MediaFilters): string {
  const query = serializeMediaFilters(filters);
  return query ? `/media?${query}` : '/media';
}

/** Query params for `GET /api/media`; the same names as the URL state, plus paging. */
export function mediaListQuery(filters: MediaFilters, cursor?: string | null): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.kind) params.set('kind', filters.kind);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.sort !== 'featured') params.set('sort', filters.sort);
  params.set('limit', '24');
  if (cursor) params.set('cursor', cursor);
  return params;
}

export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** ISO 8601 duration for JSON-LD: 96 minutes is `PT1H36M`. */
export function isoDuration(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `PT${hours > 0 ? `${hours}H` : ''}${rest > 0 || hours === 0 ? `${rest}M` : ''}`;
}

/** Kind, year, runtime, content rating: the line under every title. */
export function kickerParts(item: MediaItem): string[] {
  return [
    MEDIA_KIND_LABELS[item.kind],
    item.year ? String(item.year) : null,
    formatRuntime(item.runtimeMinutes),
    item.contentRating,
  ].filter((part): part is string => Boolean(part));
}

export const ACCESS_LABELS: Record<WatchAccess, string> = {
  free: 'Free',
  subscription: 'Subscription',
  rent: 'Rent',
  buy: 'Buy',
  unknown: 'Check site',
};

const LANGUAGE_NAMES =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'language' })
    : null;

/** "en" becomes "English"; an unknown code is shown as written. */
export function languageName(code: string | null): string | null {
  if (!code) return null;
  try {
    return LANGUAGE_NAMES?.of(code) ?? code;
  } catch {
    return code;
  }
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function orNull<T>(value: T | null | undefined): T | null {
  return value ?? null;
}

function watchLinksOf(value: unknown): WatchLink[] {
  if (!Array.isArray(value)) return [];
  return (value as Array<Partial<WatchLink>>)
    .filter((link) => typeof link.provider === 'string' && typeof link.url === 'string')
    .map((link) => ({
      provider: link.provider as string,
      url: link.url as string,
      access: link.access ?? 'unknown',
    }));
}

function statsOf(value: Partial<MediaItem['stats']> | undefined): MediaItem['stats'] {
  return { saves: value?.saves ?? 0, moved: value?.moved ?? 0, acted: value?.acted ?? 0 };
}

/**
 * Fills the gaps in a record so a page never throws on a field the API has not shipped yet.
 * The API is being built to the same contract in parallel; until it lands, a missing array
 * is an empty array and a missing scalar is null. Nothing is invented.
 */
export function normalizeMediaItem(raw: Partial<MediaItem> & { id: string }): MediaItem {
  const kind = raw.kind && KIND_SET.has(raw.kind) ? raw.kind : 'film';
  return {
    id: raw.id,
    slug: raw.slug ?? raw.id,
    title: raw.title ?? 'Untitled',
    kind,
    year: orNull(raw.year),
    releaseDate: orNull(raw.releaseDate),
    synopsis: raw.synopsis ?? '',
    tagline: orNull(raw.tagline),
    posterUrl: orNull(raw.posterUrl),
    backdropUrl: orNull(raw.backdropUrl),
    runtimeMinutes: orNull(raw.runtimeMinutes),
    contentRating: orNull(raw.contentRating),
    originalLanguage: orNull(raw.originalLanguage),
    directors: stringList(raw.directors),
    featuring: stringList(raw.featuring),
    genres: stringList(raw.genres),
    tags: stringList(raw.tags),
    contentWarnings: stringList(raw.contentWarnings),
    rating: orNull(raw.rating),
    ratingCount: orNull(raw.ratingCount),
    watchLinks: watchLinksOf(raw.watchLinks),
    trailerYoutubeId: orNull(raw.trailerYoutubeId),
    officialSite: orNull(raw.officialSite),
    actions: Array.isArray(raw.actions) ? raw.actions : [],
    externalIds: raw.externalIds ?? {},
    featured: raw.featured === true,
    sourceUrl: orNull(raw.sourceUrl),
    createdAt: raw.createdAt ?? '',
    stats: statsOf(raw.stats),
  };
}

export type ExternalLinkRef = { label: string; href: string };

/** Official site, TMDB, IMDb, Wikidata: the same list feeds the credits card and `sameAs`. */
export function externalLinks(item: MediaItem): ExternalLinkRef[] {
  const { tmdb, imdb, wikidata } = item.externalIds;
  const links: ExternalLinkRef[] = [];
  if (item.officialSite) links.push({ label: 'Official site', href: item.officialSite });
  if (tmdb) {
    const section = item.kind === 'series' ? 'tv' : 'movie';
    links.push({ label: 'TMDB', href: `https://www.themoviedb.org/${section}/${tmdb}` });
  }
  if (imdb) links.push({ label: 'IMDb', href: `https://www.imdb.com/title/${imdb}/` });
  if (wikidata) {
    links.push({ label: 'Wikidata', href: `https://www.wikidata.org/wiki/${wikidata}` });
  }
  return links;
}
