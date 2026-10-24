import { AREA_LABELS, type Area } from './types';

/**
 * The same coarse boxes the API uses to assign `place.area` (`vegan-grove-api` `src/lib/areas.ts`).
 * A directory page queries `GET /api/places` with the box, then keeps rows whose `area` matches,
 * because neighboring boxes overlap and the API has no area filter. East and north edges are
 * exclusive in the API's point test; the places query treats the box as closed, and the area
 * field is what decides membership.
 */
export type AreaBox = {
  area: Area;
  /** West edge, degrees longitude. Inclusive. */
  w: number;
  /** South edge, degrees latitude. Inclusive. */
  s: number;
  /** East edge, degrees longitude. Exclusive in the API's point test. */
  e: number;
  /** North edge, degrees latitude. Exclusive in the API's point test. */
  n: number;
};

export const AREA_BOXES: readonly AreaBox[] = [
  { area: 'sfv', w: -118.68, s: 34.12, e: -118.28, n: 34.33 },
  { area: 'la_westside', w: -118.6, s: 33.94, e: -118.33, n: 34.12 },
  { area: 'la_eastside', w: -118.33, s: 33.92, e: -118.16, n: 34.2 },
  { area: 'sgv', w: -118.16, s: 33.95, e: -117.7, n: 34.25 },
  { area: 'south_bay', w: -118.45, s: 33.7, e: -118.21, n: 33.94 },
  { area: 'long_beach', w: -118.25, s: 33.72, e: -118.11, n: 33.92 },
  { area: 'orange_county', w: -118.12, s: 33.38, e: -117.65, n: 33.95 },
  { area: 'orange_county', w: -117.65, s: 33.38, e: -117.55, n: 33.75 },
  { area: 'inland_empire', w: -117.7, s: 33.42, e: -116.6, n: 34.35 },
  { area: 'san_diego', w: -117.6, s: 32.53, e: -116.1, n: 33.45 },
  { area: 'ventura', w: -119.55, s: 34.05, e: -118.68, n: 34.5 },
];

export const AREA_ORDER = Object.keys(AREA_LABELS) as Area[];

const AREA_SET = new Set<string>(AREA_ORDER);

export function isArea(value: string): value is Area {
  return AREA_SET.has(value);
}

/** `w,s,e,n` as `GET /api/places` expects it. */
export function bboxParam(box: Pick<AreaBox, 'w' | 's' | 'e' | 'n'>): string {
  return `${box.w},${box.s},${box.e},${box.n}`;
}

/** One closed box around every home area. `other` has no box of its own. */
export function southernCaliforniaBbox(): string {
  const w = Math.min(...AREA_BOXES.map((box) => box.w));
  const s = Math.min(...AREA_BOXES.map((box) => box.s));
  const e = Math.max(...AREA_BOXES.map((box) => box.e));
  const n = Math.max(...AREA_BOXES.map((box) => box.n));
  return `${w},${s},${e},${n}`;
}

export function boxesForArea(area: Area): string[] {
  if (area === 'other') return [southernCaliforniaBbox()];
  return AREA_BOXES.filter((box) => box.area === area).map(bboxParam);
}

/** URL segment for a place's city. Empty when the name has no letters or digits. */
export function slugifyCity(city: string): string {
  return city
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function isCitySlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
}

export function areaPath(area: Area): string {
  return `/areas/${area}`;
}

export function cityPath(area: Area, citySlug: string): string {
  return `/areas/${area}/${citySlug}`;
}
