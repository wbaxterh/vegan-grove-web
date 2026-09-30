/**
 * Client-facing shapes of the API resources this app reads (spec section 4).
 * Only fields the web app renders are listed; nothing personal about other members
 * is ever part of a public resource.
 *
 * Assumes the API serializes documents with `id` (not `_id`) and ISO date strings.
 */

export type Area =
  | 'la_westside'
  | 'la_eastside'
  | 'south_bay'
  | 'long_beach'
  | 'sgv'
  | 'sfv'
  | 'orange_county'
  | 'inland_empire'
  | 'san_diego'
  | 'ventura'
  | 'other';

export const AREA_LABELS: Record<Area, string> = {
  la_westside: 'LA Westside',
  la_eastside: 'LA Eastside',
  south_bay: 'South Bay',
  long_beach: 'Long Beach',
  sgv: 'San Gabriel Valley',
  sfv: 'San Fernando Valley',
  orange_county: 'Orange County',
  inland_empire: 'Inland Empire',
  san_diego: 'San Diego',
  ventura: 'Ventura',
  other: 'Other',
};

export type PlaceType =
  | 'sanctuary'
  | 'garden'
  | 'restaurant'
  | 'cafe'
  | 'grocery'
  | 'shop'
  | 'organization'
  | 'venue';

export type VeganLevel = 'full' | 'options';

// The API serializes locations as { lng, lat } (GeoJSON stays inside the database).
export type GeoPoint = { lng: number; lat: number };

/**
 * Provenance id (spec section 9): `osm`, `curated`, `user`, or a namespaced ingest source such
 * as `bot:grokbot`. Only `osm` changes what the site renders (the ODbL attribution).
 */
export type PlaceSource = string;

export type Place = {
  id: string;
  source?: PlaceSource;
  name: string;
  slug: string;
  type: PlaceType;
  veganLevel: VeganLevel;
  /** Set at import for places with an OSM brand tag. Hidden by default, never removed. */
  chain?: boolean;
  location: GeoPoint;
  address: string;
  city: string;
  postcode?: string;
  area: Area;
  website?: string;
  phone?: string;
  /** Free text, usually OSM `opening_hours` syntax; `;` and newlines separate rules. */
  hours?: string | null;
  tags: string[];
  description: string;
  photoKeys: string[];
  ratingAvg: number;
  reviewCount: number;
};

/** The slim shape `GET /api/places/map-pins` returns: enough to draw and label a marker. */
export type MapPin = Pick<Place, 'id' | 'slug' | 'name' | 'type' | 'veganLevel' | 'location'> & {
  chain: boolean;
};

export type EventType =
  | 'protest'
  | 'vigil'
  | 'outreach'
  | 'potluck'
  | 'sanctuary_day'
  | 'screening'
  | 'meeting'
  | 'other';

export type EventVisibility = 'public' | 'grove' | 'friends';

export type GroveEvent = {
  id: string;
  title: string;
  slug: string;
  type: EventType;
  startsAt: string;
  endsAt: string;
  venueName: string;
  /** Omitted by the API when `detailsAfterRsvp` is set and the viewer has not RSVPed. */
  address?: string;
  detailsAfterRsvp: boolean;
  hostType: 'grove' | 'organization';
  hostName?: string;
  hostSlug?: string;
  description: string;
  coverKey?: string;
  visibility: EventVisibility;
  rsvpCount: number;
  status: 'draft' | 'published' | 'cancelled';
};

export type Grove = {
  id: string;
  name: string;
  slug: string;
  area: Area;
  description: string;
  memberCount: number;
};

export type MediaKind = 'documentary' | 'film' | 'series' | 'talk' | 'short';

export type WatchAccess = 'free' | 'subscription' | 'rent' | 'buy' | 'unknown';

export type WatchLink = { provider: string; url: string; access: WatchAccess };

export type MediaActionType = 'petition' | 'donate' | 'pledge' | 'volunteer' | 'guide' | 'learn';

/** A real-world next step attached to a title: "Sign the petition", "Volunteer with ...". */
export type MediaAction = {
  label: string;
  url: string;
  type: MediaActionType;
  /** Organisation name as written on its own site. */
  org?: string | null;
};

/**
 * A library entry as the API serializes it (media contract, section 10.1). Clients render
 * these fields, they never derive them. Image URLs are null until the media CDN exists.
 */
export type MediaItem = {
  id: string;
  slug: string;
  title: string;
  kind: MediaKind;
  year: number | null;
  /** YYYY-MM-DD. */
  releaseDate: string | null;
  synopsis: string;
  tagline: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  runtimeMinutes: number | null;
  contentRating: string | null;
  originalLanguage: string | null;
  directors: string[];
  featuring: string[];
  genres: string[];
  tags: string[];
  /** e.g. "graphic footage", "animal death". */
  contentWarnings: string[];
  /** TMDB, one decimal. */
  rating: number | null;
  ratingCount: number | null;
  watchLinks: WatchLink[];
  trailerYoutubeId: string | null;
  officialSite: string | null;
  actions: MediaAction[];
  externalIds: { tmdb?: string; wikidata?: string; imdb?: string };
  featured: boolean;
  sourceUrl: string | null;
  createdAt: string;
  /** Counts only, never who. */
  stats: { saves: number; moved: number; acted: number };
};

export type MediaReaction = 'moved' | 'acted';

/** Only on `GET /api/media/:slug` when the request carries a valid session. */
export type MediaViewer = { saved: boolean; reactions: MediaReaction[] };

/** One shelf on the library page: an editorial collection or an automatic row. */
export type MediaRow = {
  /** 'collection:start-here' | 'auto:free' | 'auto:tag:ethics' */
  key: string;
  name: string;
  description: string | null;
  kind: 'collection' | 'auto';
  /** Collection slug, for the "See all" link. */
  slug: string | null;
  /** At most 12. */
  items: MediaItem[];
};

export type MediaCollection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  order: number;
  /** Ordered as the editor set them. */
  items: MediaItem[];
};

/** `GET /api/media/home`. */
export type MediaHome = { hero: MediaItem[]; rows: MediaRow[] };

export type GuideCategory =
  | 'outreach'
  | 'rights'
  | 'vegan101'
  | 'sanctuary'
  | 'nutrition'
  | 'other';

export const GUIDE_CATEGORY_LABELS: Record<GuideCategory, string> = {
  outreach: 'Outreach',
  rights: 'Know your rights',
  vegan101: 'Vegan 101',
  sanctuary: 'Sanctuary volunteering',
  nutrition: 'Nutrition',
  other: 'Other',
};

export type Guide = {
  id: string;
  title: string;
  slug: string;
  category: GuideCategory;
  /** Markdown source. */
  body: string;
};

/** The signed-in member as returned by `GET /api/me`. Never rendered for anyone else. */
export type CurrentUser = {
  id: string;
  handle: string;
  avatarKey?: string;
  homeArea: Area;
  publicPostsEnabled: boolean;
  interests: string[];
  role: 'member' | 'admin';
};

export type PublicStats = {
  places: number;
  events: number;
  groves: number;
  members: number;
};
