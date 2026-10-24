import { Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CreatorCard } from '@/components/creators/creator-card';
import { ApiUnavailable, EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  creatorFiltersActive,
  creatorHref,
  filterCreators,
  isVocabularyTopic,
  languageLabel,
  languagesIn,
  parseCreatorFilters,
  shelvesFor,
} from '@/lib/creators';
import { loadAllCreators } from '@/lib/directory.server';
import { creatorTopicLabel } from '@/lib/labels';
import { CREATOR_TOPICS } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Creators',
  description:
    'A curated directory of people who make vegan work in public: cooking, outreach, nutrition, training, animal rights, and the environment.',
  alternates: { canonical: '/creators' },
};

// Per request, so a 404 from an API that is not deployed yet cannot stick in the page cache.
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function toSearchParams(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === 'string') params.set(key, first);
  }
  return params;
}

export default async function CreatorsPage({ searchParams }: Props) {
  const filters = parseCreatorFilters(toSearchParams(await searchParams));
  const { items, unavailable } = await loadAllCreators();
  const shown = filterCreators(items, filters);
  const shelves = creatorFiltersActive(filters) ? [] : shelvesFor(items);
  const languages = languagesIn(items);
  const shortQuery = filters.q.length === 1;

  return (
    <Screen
      label="Learn"
      title="Creators"
      context="People who make vegan work in public: a name, a short bio in our own words, and links out to their own sites. The directory is alphabetical. Shelves are how an editor groups a topic."
      action={
        <search>
          <form method="get" action="/creators" className="flex flex-wrap items-end gap-3">
            {filters.topic ? <input type="hidden" name="topic" value={filters.topic} /> : null}
            <Input
              name="q"
              defaultValue={filters.q}
              placeholder="Search by name"
              aria-label="Search by name"
              className="min-w-48 flex-1"
            />
            <NativeSelect name="lang" defaultValue={filters.lang} aria-label="Language">
              <NativeSelectOption value="">Any language</NativeSelectOption>
              {languages.map((code) => (
                <NativeSelectOption key={code} value={code}>
                  {languageLabel(code)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </search>
      }
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">
            About this list
          </p>
          <p className="text-muted-foreground">
            A curator writes every bio and checks every link before it is published. Audience size
            is not collected, and it is not shown.
          </p>
          <p className="text-muted-foreground">
            Portraits stay on their own sites. These pages show initials.
          </p>
          <p className="text-muted-foreground">
            More to learn:{' '}
            <Link href="/guides" className="text-vg-accent-2 hover:underline">
              guides
            </Link>{' '}
            and the{' '}
            <Link href="/media" className="text-vg-accent-2 hover:underline">
              media library
            </Link>
            .
          </p>
        </>
      }
    >
      <nav aria-label="Topics" className="flex flex-wrap gap-2">
        <Link
          href={creatorHref({ ...filters, topic: '' })}
          aria-current={filters.topic ? undefined : 'page'}
          className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground aria-[current=page]:border-vg-primary aria-[current=page]:text-foreground"
        >
          All topics
        </Link>
        {CREATOR_TOPICS.map((topic) => (
          <Link
            key={topic}
            href={creatorHref({ ...filters, topic })}
            aria-current={filters.topic === topic ? 'page' : undefined}
            className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground aria-[current=page]:border-vg-primary aria-[current=page]:text-foreground"
          >
            {creatorTopicLabel(topic)}
          </Link>
        ))}
      </nav>

      {shortQuery ? (
        <p className="text-sm text-muted-foreground">Search needs at least two letters.</p>
      ) : null}

      {unavailable ? (
        <ApiUnavailable what="Creators" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No creators published yet"
          description="Entries are reviewed by hand before they appear here."
        />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nothing matches"
          description="Try another topic, language, or name."
        />
      ) : (
        <>
          {shelves.map((shelf) => (
            <section
              key={shelf.topic}
              aria-labelledby={`shelf-${shelf.topic}`}
              className="space-y-3"
            >
              <header className="flex items-end justify-between gap-4">
                <div>
                  <h2
                    id={`shelf-${shelf.topic}`}
                    className="font-heading text-lg font-semibold sm:text-xl"
                  >
                    {shelf.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{shelf.description}</p>
                </div>
                <Link
                  href={creatorHref({ ...filters, topic: shelf.topic })}
                  className="shrink-0 text-sm font-medium text-vg-accent-2 hover:underline"
                >
                  See all
                </Link>
              </header>
              <ul className="grid gap-4 md:grid-cols-2">
                {shelf.items.map((creator) => (
                  <li key={creator.id}>
                    <CreatorCard creator={creator} filters={filters} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section aria-label="Directory" className="space-y-3">
            <header>
              <h2 className="font-heading text-lg font-semibold sm:text-xl">
                {filters.topic && isVocabularyTopic(filters.topic)
                  ? creatorTopicLabel(filters.topic)
                  : 'Directory'}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Alphabetical.</p>
            </header>
            <ul className="grid gap-4 md:grid-cols-2">
              {shown.map((creator) => (
                <li key={creator.id}>
                  <CreatorCard creator={creator} filters={filters} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </Screen>
  );
}
