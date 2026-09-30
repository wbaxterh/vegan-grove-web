import { Film, SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import { ApiUnavailable, EmptyState } from '@/components/empty-state';
import { HeroBillboard } from '@/components/media/hero-billboard';
import { MediaBrowseGrid } from '@/components/media/media-browse-grid';
import { MediaFilterBar } from '@/components/media/media-filter-bar';
import { NoHostingNote } from '@/components/media/no-hosting-note';
import { PosterShelf } from '@/components/media/poster-shelf';
import { Screen } from '@/components/screen';
import {
  DEFAULT_MEDIA_FILTERS,
  MEDIA_SORT_OPTIONS,
  mediaFiltersActive,
  mediaHref,
  mediaListQuery,
  parseMediaFilters,
} from '@/lib/media-library';
import { loadMediaHome, loadMediaPage } from '@/lib/media-library.server';
import type { MediaRow } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Media library',
  description:
    'Documentaries, films, series, talks, and shorts about animals, health, and the planet, with where to watch each one and what to do next.',
  alternates: { canonical: '/media' },
};

export const revalidate = 60;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function toSearchParams(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === 'string') params.set(key, first);
  }
  return params;
}

/** Collections get their page; automatic topic rows open the filtered library. */
function seeAllHref(row: MediaRow): string | null {
  if (row.kind === 'collection' && row.slug) return `/media/collections/${row.slug}`;
  const tag = row.key.startsWith('auto:tag:') ? row.key.slice('auto:tag:'.length) : null;
  return tag ? mediaHref({ ...DEFAULT_MEDIA_FILTERS, tag }) : null;
}

export default async function MediaPage({ searchParams }: Props) {
  const filters = parseMediaFilters(toSearchParams(await searchParams));
  const active = mediaFiltersActive(filters);

  // The home rows are skipped, not hidden, when a filter is set: one request less.
  const [home, page] = await Promise.all([
    active ? Promise.resolve(null) : loadMediaHome(),
    loadMediaPage(filters),
  ]);
  const query = mediaListQuery(filters).toString();
  const hero = home?.hero ?? [];
  const rows = home?.rows ?? [];
  const sortLabel =
    MEDIA_SORT_OPTIONS.find((option) => option.value === filters.sort)?.label ?? 'Featured';

  return (
    <Screen
      label="Learn"
      title="Media library"
      context="Documentaries, films, series, talks, and shorts that turn curiosity into action, with where to watch each one. Trailers load only when you click them, and nothing here records what you watch."
      action={
        <div className="space-y-6">
          {!active && hero.length > 0 ? <HeroBillboard items={hero} /> : null}
          <MediaFilterBar filters={filters} />
        </div>
      }
    >
      {!active
        ? rows.map((row) => (
            <PosterShelf
              key={row.key}
              title={row.name}
              description={row.description}
              seeAllHref={seeAllHref(row)}
              items={row.items}
            />
          ))
        : null}

      <section aria-labelledby="browse-heading" className="space-y-4">
        <header>
          <h2 id="browse-heading" className="font-heading text-lg font-semibold sm:text-xl">
            {active ? 'Results' : 'Browse everything'}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {sortLabel}
            {filters.q ? ` for "${filters.q}"` : ''}
          </p>
        </header>
        {page.unavailable ? (
          <ApiUnavailable what="Media items" />
        ) : page.items.length === 0 ? (
          active ? (
            <EmptyState
              icon={SearchX}
              title="No titles match"
              description="Try another word, clear the kind, or check the topic tag."
            />
          ) : (
            <EmptyState
              icon={Film}
              title="The library is empty"
              description="Titles are curated by hand. The first batch is on its way."
            />
          )
        ) : (
          <MediaBrowseGrid
            key={query}
            initialItems={page.items}
            initialCursor={page.nextCursor}
            source={{ kind: 'library', query }}
          />
        )}
      </section>

      <NoHostingNote />
    </Screen>
  );
}
