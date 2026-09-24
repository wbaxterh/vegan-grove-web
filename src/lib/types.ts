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
  | 'restaurant'
  | 'cafe'
  | 'grocery'
  | 'shop'
  | 'organization'
  | 'venue';

export type VeganLevel = 'full' | 'options';

export type GeoPoint = { type: 'Point'; coordinates: [number, number] };

export type Place = {
  id: string;
  name: string;
  slug: string;
  type: PlaceType;
  veganLevel: VeganLevel;
  location: GeoPoint;
  address: string;
  city: string;
  area: Area;
  website?: string;
  hours?: string;
  tags: string[];
  description: string;
  photoKeys: string[];
  ratingAvg: number;
  reviewCount: number;
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

export type MediaItem = {
  id: string;
  title: string;
  slug: string;
  kind: MediaKind;
  year: number;
  synopsis: string;
  posterKey?: string;
  watchLinks: { provider: string; url: string }[];
  trailerYoutubeId?: string;
  tags: string[];
  featured: boolean;
};

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
