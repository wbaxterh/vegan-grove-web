import type {
  CreatorTopic,
  EventType,
  MediaKind,
  OrganizationType,
  PlaceType,
  VeganLevel,
} from './types';
import { CREATOR_TOPICS } from './types';

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  sanctuary: 'Sanctuary',
  garden: 'Garden',
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  grocery: 'Grocery',
  shop: 'Shop',
  organization: 'Organization',
  venue: 'Venue',
};

/** Display order everywhere types are listed: the places animals live come first. */
export const PLACE_TYPE_ORDER: readonly PlaceType[] = [
  'sanctuary',
  'garden',
  'restaurant',
  'cafe',
  'grocery',
  'shop',
  'organization',
  'venue',
];

/** One-line context for the types that are actions in themselves, not errands. */
export const PLACE_TYPE_BLURBS: Partial<Record<PlaceType, string>> = {
  sanctuary:
    'Sanctuaries are homes for rescued animals, not attractions. Most run on volunteers and donations, so check the website for visiting days and what they need before you go.',
  garden:
    'Community gardens and allotments grow food without animals in the loop. Plots, tools, and open days are usually run by neighbours, so ask before you dig.',
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

/** Sanctuaries and gardens are not food businesses; a vegan-level badge on them reads as noise. */
export function showsVeganLevel(type: string): boolean {
  return type !== 'sanctuary' && type !== 'garden';
}

export const CREATOR_TOPIC_LABELS: Record<CreatorTopic, string> = {
  outreach: 'Outreach',
  'animal-rights': 'Animal rights',
  cooking: 'Cooking',
  nutrition: 'Nutrition',
  fitness: 'Fitness',
  environment: 'Environment',
};

export function creatorTopicLabel(topic: string): string {
  if ((CREATOR_TOPICS as readonly string[]).includes(topic)) {
    return CREATOR_TOPIC_LABELS[topic as CreatorTopic];
  }
  return topic.replace(/-/g, ' ');
}

export const CREATOR_KIND_LABELS: Record<'person' | 'duo' | 'team', string> = {
  person: 'Person',
  duo: 'Duo',
  team: 'Team',
};

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  org: 'Organization',
  sanctuary: 'Sanctuary',
  business: 'Business',
};
