import { PLACE_TYPE_ORDER } from './labels';
import type { PlaceType } from './types';

/**
 * Map filters live in the URL so a filtered view can be shared. The defaults lean vegan
 * (spec section 9): fully vegan places only, every type, chains hidden. A default never
 * appears in the query, so the plain `/places` URL stays the canonical one.
 *
 *   ?level=all&types=sanctuary,garden&chains=1
 *
 * `level` is `full` (default), `options`, `all`, or `none`; `types` is a comma list or
 * `none`; `chains=1` includes chain locations. `none` states are honest rather than clever:
 * nothing is fetched and the list says why.
 */

export type LevelFilter = 'full' | 'options' | 'all' | 'none';

export type PlaceFilters = {
  full: boolean;
  options: boolean;
  types: readonly PlaceType[];
  chains: boolean;
};

export const DEFAULT_FILTERS: PlaceFilters = {
  full: true,
  options: false,
  types: PLACE_TYPE_ORDER,
  chains: false,
};

const TYPE_SET = new Set<string>(PLACE_TYPE_ORDER);

function isPlaceType(value: string): value is PlaceType {
  return TYPE_SET.has(value);
}

export function levelOf(filters: Pick<PlaceFilters, 'full' | 'options'>): LevelFilter {
  if (filters.full && filters.options) return 'all';
  if (filters.full) return 'full';
  if (filters.options) return 'options';
  return 'none';
}

/** Types in display order, or `null` when every type is selected. */
function selectedTypes(types: readonly PlaceType[]): PlaceType[] | null {
  const chosen = new Set(types);
  if (chosen.size === PLACE_TYPE_ORDER.length) return null;
  return PLACE_TYPE_ORDER.filter((type) => chosen.has(type));
}

export function parsePlaceFilters(params: URLSearchParams): PlaceFilters {
  const level = params.get('level');
  const full = level === null || level === 'full' || level === 'all';
  const options = level === 'options' || level === 'all';

  const rawTypes = params.get('types');
  let types: readonly PlaceType[] = PLACE_TYPE_ORDER;
  if (rawTypes === 'none') {
    types = [];
  } else if (rawTypes) {
    const chosen = rawTypes
      .split(',')
      .map((type) => type.trim())
      .filter(isPlaceType);
    // An unknown-only list (a typo, an old link) falls back to every type.
    if (chosen.length > 0) types = PLACE_TYPE_ORDER.filter((type) => chosen.includes(type));
  }

  return { full, options, types, chains: params.get('chains') === '1' };
}

/** Query string without the `?`; empty when everything is at its default. */
export function serializePlaceFilters(filters: PlaceFilters): string {
  const params = new URLSearchParams();
  const level = levelOf(filters);
  if (level !== 'full') params.set('level', level);
  const types = selectedTypes(filters.types);
  if (types) params.set('types', types.length === 0 ? 'none' : types.join(','));
  if (filters.chains) params.set('chains', '1');
  return params.toString();
}

/** True when the filters can never match anything, so no request should be made. */
export function filtersAreEmpty(filters: PlaceFilters): boolean {
  return levelOf(filters) === 'none' || filters.types.length === 0;
}

/**
 * Query params for `GET /api/places` and `GET /api/places/map-pins`. The bounding box is the
 * only location that ever leaves the browser (privacy rule 3).
 */
export function placesQuery(filters: PlaceFilters, bbox: string): URLSearchParams {
  const params = new URLSearchParams({ bbox, veganLevel: levelOf(filters) });
  const types = selectedTypes(filters.types);
  if (types) params.set('types', types.join(','));
  params.set('includeChains', filters.chains ? 'true' : 'false');
  return params;
}
