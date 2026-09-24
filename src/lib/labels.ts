import type { EventType, MediaKind, PlaceType, VeganLevel } from './types';

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  sanctuary: 'Sanctuary',
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  grocery: 'Grocery',
  shop: 'Shop',
  organization: 'Organization',
  venue: 'Venue',
};

export const VEGAN_LEVEL_LABELS: Record<VeganLevel, string> = {
  full: 'Fully vegan',
  options: 'Vegan options',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  protest: 'Protest',
  vigil: 'Vigil',
  outreach: 'Outreach',
  potluck: 'Potluck',
  sanctuary_day: 'Sanctuary day',
  screening: 'Screening',
  meeting: 'Meeting',
  other: 'Event',
};

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  documentary: 'Documentary',
  film: 'Film',
  series: 'Series',
  talk: 'Talk',
  short: 'Short',
};
