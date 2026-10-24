import { CREATOR_TOPICS, type Creator, type CreatorTopic } from './types';

/**
 * The only curation on the directory. Each shelf is a vocabulary topic, shown in this
 * order, and the people inside it stay alphabetical. Nothing here is ordered by reach.
 */
export const CREATOR_SHELVES: readonly {
  topic: CreatorTopic;
  title: string;
  description: string;
}[] = [
  {
    topic: 'cooking',
    title: 'Start here for cooking',
    description: 'Cooks who teach the food, listed alphabetically.',
  },
  {
    topic: 'outreach',
    title: 'Start here for outreach',
    description: 'People who explain the case in public, listed alphabetically.',
  },
  {
    topic: 'nutrition',
    title: 'Start here for nutrition',
    description: 'How to eat, listed alphabetically.',
  },
  {
    topic: 'animal-rights',
    title: 'Start here for animal rights',
    description: 'The ethical case, listed alphabetically.',
  },
  {
    topic: 'fitness',
    title: 'Start here for training',
    description: 'Training and sport, listed alphabetically.',
  },
  {
    topic: 'environment',
    title: 'Start here for the environment',
    description: 'Food and the planet, listed alphabetically.',
  },
];

export type CreatorFilters = {
  topic: string;
  lang: string;
  q: string;
};

export const EMPTY_CREATOR_FILTERS: CreatorFilters = { topic: '', lang: '', q: '' };

export function parseCreatorFilters(params: URLSearchParams): CreatorFilters {
  const topic = params.get('topic')?.trim() ?? '';
  const lang = params.get('lang')?.trim().toLowerCase() ?? '';
  const q = params.get('q')?.trim() ?? '';
  return {
    topic: topic.length > 0 && topic.length <= 60 ? topic : '',
    lang: /^[a-z]{2,3}$/.test(lang) ? lang : '',
    q: q.slice(0, 80),
  };
}

export function creatorFiltersActive(filters: CreatorFilters): boolean {
  return Boolean(filters.topic || filters.lang || filters.q.length >= 2);
}

export function creatorHref(filters: CreatorFilters): string {
  const params = new URLSearchParams();
  if (filters.topic) params.set('topic', filters.topic);
  if (filters.lang) params.set('lang', filters.lang);
  if (filters.q) params.set('q', filters.q);
  const query = params.toString();
  return query ? `/creators?${query}` : '/creators';
}

export function sortCreators(items: Creator[]): Creator[] {
  return [...items].sort(
    (a, b) =>
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.name.localeCompare(b.name),
  );
}

function haystack(creator: Creator): string {
  return [creator.name, creator.bio, ...creator.alsoKnownAs, ...creator.topics]
    .join('\n')
    .toLowerCase();
}

/** A one-letter query is too short for the API, so it does not narrow the list. */
export function filterCreators(items: Creator[], filters: CreatorFilters): Creator[] {
  const q = filters.q.toLowerCase();
  const searching = q.length >= 2;
  return items.filter((creator) => {
    if (filters.topic && !creator.topics.includes(filters.topic)) return false;
    if (filters.lang && !creator.languages.includes(filters.lang)) return false;
    if (searching && !haystack(creator).includes(q)) return false;
    return true;
  });
}

export type CreatorShelf = {
  topic: CreatorTopic;
  title: string;
  description: string;
  items: Creator[];
};

export function shelvesFor(items: Creator[]): CreatorShelf[] {
  return CREATOR_SHELVES.flatMap((shelf) => {
    const matched = items.filter((creator) => creator.topics.includes(shelf.topic));
    return matched.length > 0 ? [{ ...shelf, items: matched }] : [];
  });
}

export function languagesIn(items: Creator[]): string[] {
  const codes = new Set<string>();
  for (const creator of items) {
    for (const language of creator.languages) {
      if (/^[a-z]{2,3}$/.test(language)) codes.add(language);
    }
  }
  return [...codes].sort();
}

export function isVocabularyTopic(topic: string): topic is CreatorTopic {
  return (CREATOR_TOPICS as readonly string[]).includes(topic);
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

export function countryLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function languageLabel(code: string): string {
  try {
    return languageNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Two letters, from the first and last word, or the first two letters of a single word. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const first = words[0]?.[0] ?? '';
  const last = words[words.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}

export function normalizeCreator(raw: Creator): Creator | null {
  if (!raw || typeof raw.name !== 'string' || typeof raw.slug !== 'string' || !raw.slug)
    return null;
  return {
    ...raw,
    alsoKnownAs: Array.isArray(raw.alsoKnownAs)
      ? raw.alsoKnownAs.filter((item) => typeof item === 'string')
      : [],
    members: Array.isArray(raw.members)
      ? raw.members.filter((item) => typeof item === 'string')
      : [],
    topics: Array.isArray(raw.topics) ? raw.topics.filter((item) => typeof item === 'string') : [],
    languages: Array.isArray(raw.languages)
      ? raw.languages.filter((item) => typeof item === 'string')
      : [],
    bio: typeof raw.bio === 'string' ? raw.bio : '',
    socials: raw.socials ?? {},
    website: raw.website ?? null,
    podcast: raw.podcast ?? null,
    country: raw.country ?? null,
    veganSource: raw.veganSource?.url ? raw.veganSource : null,
    kind: raw.kind ?? 'person',
  };
}
