import { cache } from 'react';
import { AREA_ORDER, boxesForArea, cityPath, isCitySlug, slugifyCity } from './areas';
import { normalizeCreator, sortCreators } from './creators';
import { type LoadedList, loadOneStatus, loadPages } from './loaders';
import { SITE } from './site';
import { AREA_LABELS, type Area, type Creator, type Organization, type Place } from './types';

function normalizeOrganization(raw: Organization): Organization | null {
  if (!raw || typeof raw.name !== 'string' || typeof raw.slug !== 'string' || !raw.slug)
    return null;
  return {
    ...raw,
    description: typeof raw.description === 'string' ? raw.description : '',
    website: raw.website ?? null,
    socials: raw.socials ?? {},
    area: raw.area ?? null,
    verified: Boolean(raw.verified),
  };
}

function keep<T>(items: (T | null)[]): T[] {
  return items.filter((item): item is T => item !== null);
}

export const loadCreator = cache(async (slug: string) => {
  const loaded = await loadOneStatus<Creator>(`/creators/${encodeURIComponent(slug)}`, 'creator');
  if (loaded.status !== 'ok') return loaded;
  const item = normalizeCreator(loaded.item);
  return item ? { status: 'ok' as const, item } : { status: 'unavailable' as const };
});

export const loadOrganization = cache(async (slug: string) => {
  const loaded = await loadOneStatus<Organization>(
    `/organizations/${encodeURIComponent(slug)}`,
    'organization',
  );
  if (loaded.status !== 'ok') return loaded;
  const item = normalizeOrganization(loaded.item);
  return item ? { status: 'ok' as const, item } : { status: 'unavailable' as const };
});

export async function loadAllCreators(): Promise<LoadedList<Creator>> {
  const loaded = await loadPages<Creator>('/creators');
  if (loaded.unavailable) return loaded;
  return { items: sortCreators(keep(loaded.items.map(normalizeCreator))), unavailable: false };
}

export async function loadAllOrganizations(): Promise<LoadedList<Organization>> {
  const loaded = await loadPages<Organization>('/organizations');
  if (loaded.unavailable) return loaded;
  return { items: keep(loaded.items.map(normalizeOrganization)), unavailable: false };
}

function placesPath(bbox: string): string {
  const params = new URLSearchParams({
    bbox,
    veganLevel: 'all',
    includeChains: 'true',
  });
  return `/places?${params.toString()}`;
}

/**
 * Approved places for one home area. The places API only filters by bounding box, so each
 * area's box is queried and rows are kept when `place.area` matches. `other` uses the box
 * around Southern California; a place outside that box is not listed.
 */
export const loadPlacesForArea = cache(async (area: Area): Promise<LoadedList<Place>> => {
  const boxes = boxesForArea(area);
  const pages = await Promise.all(boxes.map((bbox) => loadPages<Place>(placesPath(bbox))));
  if (pages.some((page) => page.unavailable)) return { items: [], unavailable: true };
  const seen = new Set<string>();
  const items: Place[] = [];
  for (const page of pages) {
    for (const place of page.items) {
      if (!place || place.area !== area || !place.slug || seen.has(place.id)) continue;
      seen.add(place.id);
      items.push(place);
    }
  }
  return { items, unavailable: false };
});

export type AreaCity = { slug: string; name: string };

export function citiesIn(places: Place[]): AreaCity[] {
  const bySlug = new Map<string, string>();
  for (const place of places) {
    const slug = slugifyCity(place.city ?? '');
    if (!isCitySlug(slug) || bySlug.has(slug)) continue;
    bySlug.set(slug, place.city);
  }
  return [...bySlug.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
}

/** Creator, organization, area, and city paths for the sitemap. Empty when the API is down. */
export async function directorySitemapPaths(): Promise<string[]> {
  const [creators, organizations, areas] = await Promise.all([
    loadAllCreators(),
    loadAllOrganizations(),
    Promise.all(AREA_ORDER.map(async (area) => ({ area, loaded: await loadPlacesForArea(area) }))),
  ]);
  const paths = [
    ...creators.items.map((creator) => `/creators/${creator.slug}`),
    ...organizations.items.map((organization) => `/organizations/${organization.slug}`),
  ];
  for (const { area, loaded } of areas) {
    paths.push(`/areas/${area}`);
    if (loaded.unavailable) continue;
    for (const city of citiesIn(loaded.items)) paths.push(cityPath(area, city.slug));
  }
  return paths;
}

function plain(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const clean = value.replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim();
  return clean ? clean.slice(0, 200) : undefined;
}

function bullet(href: string, label: string, detail?: string): string {
  const extra = plain(detail);
  return `- [${label}](${SITE.url}${href})${extra ? `: ${extra}` : ''}`;
}

/** Sections appended to llms.txt. Static area links remain when the API is down. */
export async function directoryLlmsLines(): Promise<string[]> {
  const [creators, organizations, areas] = await Promise.all([
    loadAllCreators(),
    loadAllOrganizations(),
    Promise.all(AREA_ORDER.map(async (area) => ({ area, loaded: await loadPlacesForArea(area) }))),
  ]);

  const creatorLines = creators.unavailable
    ? ['- (creators are unavailable right now)']
    : creators.items.length === 0
      ? ['- (no creators published yet)']
      : creators.items.map((creator) =>
          bullet(`/creators/${creator.slug}`, creator.name, creator.bio || undefined),
        );

  const organizationLines = organizations.unavailable
    ? ['- (organizations are unavailable right now)']
    : organizations.items.length === 0
      ? ['- (no organizations published yet)']
      : organizations.items.map((organization) =>
          bullet(
            `/organizations/${organization.slug}`,
            organization.name,
            organization.description || undefined,
          ),
        );

  const areaLines: string[] = [];
  for (const { area, loaded } of areas) {
    areaLines.push(bullet(`/areas/${area}`, AREA_LABELS[area]));
    if (loaded.unavailable) continue;
    for (const city of citiesIn(loaded.items)) {
      areaLines.push(`  - [${city.name}](${SITE.url}${cityPath(area, city.slug)})`);
    }
  }

  return [
    '## Creators',
    '',
    'A curated directory of people who make vegan work in public. Alphabetical, with editor',
    'shelves for a topic. Audience size is not part of it, and there are no portraits.',
    '',
    ...creatorLines,
    '',
    '## Organizations',
    '',
    'Chapters, sanctuaries, and businesses that host actions. Verified organizations are listed first.',
    '',
    ...organizationLines,
    '',
    '## Areas',
    '',
    'Approved places by region, and by city inside that region.',
    '',
    ...areaLines,
    '',
  ];
}
