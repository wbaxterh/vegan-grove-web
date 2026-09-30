import type { Metadata } from 'next';
import { ApiUnavailable } from '@/components/empty-state';
import { JsonLd } from '@/components/json-ld';
import {
  BackdropBand,
  ContentWarningsSection,
  CreditsAside,
  DetailBreadcrumb,
  DetailHeader,
  SectionHeading,
  SynopsisSection,
  TakeActionSection,
  WatchSection,
} from '@/components/media/media-detail-sections';
import { NoHostingNote } from '@/components/media/no-hosting-note';
import { PosterShelf } from '@/components/media/poster-shelf';
import { TrailerEmbed } from '@/components/media/trailer-embed';
import { Screen } from '@/components/screen';
import { MEDIA_KIND_LABELS } from '@/lib/labels';
import { usableImageUrl } from '@/lib/media';
import { externalLinks, isoDuration, topicTags } from '@/lib/media-library';
import { loadMediaDetail, loadRelated } from '@/lib/media-library.server';
import { SITE } from '@/lib/site';
import type { MediaItem } from '@/lib/types';

type Props = { params: Promise<{ slug: string }> };

function describe(item: MediaItem): string {
  const text =
    item.synopsis || item.tagline || `${MEDIA_KIND_LABELS[item.kind]} in the Vegan Grove library.`;
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text;
}

/** schema.org `Movie` with an ISO 8601 `duration` and the topic tags as `about`. */
function movieJsonLd(item: MediaItem, url: string): Record<string, unknown> {
  const image = usableImageUrl(item.posterUrl) ?? usableImageUrl(item.backdropUrl);
  const person = (name: string) => ({ '@type': 'Person', name });
  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: item.title,
    description: item.synopsis || item.tagline || undefined,
    url,
    image: image ?? undefined,
    datePublished: item.releaseDate ?? (item.year ? String(item.year) : undefined),
    duration: isoDuration(item.runtimeMinutes) ?? undefined,
    director: item.directors.map(person),
    actor: item.featuring.map(person),
    genre: item.genres,
    about: topicTags(item).map((name) => ({ '@type': 'Thing', name })),
    contentRating: item.contentRating ?? undefined,
    inLanguage: item.originalLanguage ?? undefined,
    sameAs: externalLinks(item).map((link) => link.href),
    aggregateRating:
      item.rating !== null && item.ratingCount
        ? {
            '@type': 'AggregateRating',
            ratingValue: item.rating,
            ratingCount: item.ratingCount,
            bestRating: 10,
            worstRating: 0,
          }
        : undefined,
    potentialAction: item.actions.map((action) => ({
      '@type': 'Action',
      name: action.label,
      target: action.url,
    })),
  };
}

function breadcrumbJsonLd(item: MediaItem, url: string): Record<string, unknown> {
  const crumb = (position: number, name: string, target: string) => ({
    '@type': 'ListItem',
    position,
    name,
    item: target,
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      crumb(1, SITE.name, SITE.url),
      crumb(2, 'Media library', `${SITE.url}/media`),
      crumb(3, item.title, url),
    ],
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await loadMediaDetail(slug);
  if (!item) return { title: 'Media' };
  const image = usableImageUrl(item.backdropUrl) ?? usableImageUrl(item.posterUrl);
  const description = describe(item);
  return {
    title: item.title,
    description,
    alternates: { canonical: `/media/${item.slug}` },
    openGraph: {
      type: 'video.movie',
      title: item.title,
      description,
      url: `/media/${item.slug}`,
      images: image ? [image] : undefined,
      directors: item.directors,
      actors: item.featuring,
      tags: topicTags(item),
      duration: item.runtimeMinutes ? item.runtimeMinutes * 60 : undefined,
      releaseDate: item.releaseDate ?? undefined,
    },
  };
}

/**
 * One title: where to watch it, who made it, what to be ready for, and what to do next.
 * The session, when there is one, only changes the action row; everything else is public.
 */
export default async function MediaItemPage({ params }: Props) {
  const { slug } = await params;
  const { item, viewer, signedIn } = await loadMediaDetail(slug);

  if (!item) {
    return (
      <Screen label="Media" title="Media">
        <ApiUnavailable what="Media items" />
      </Screen>
    );
  }

  const related = await loadRelated(slug);
  const url = `${SITE.url}/media/${item.slug}`;

  return (
    <>
      <JsonLd data={movieJsonLd(item, url)} />
      <JsonLd data={breadcrumbJsonLd(item, url)} />

      <div className="relative">
        <BackdropBand item={item} />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-36 pb-10 sm:px-6 sm:pt-48 lg:px-8">
          <DetailBreadcrumb kind={item.kind} />
          <DetailHeader item={item} viewer={viewer} signedIn={signedIn} />

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0 space-y-10">
              <SynopsisSection item={item} />
              <WatchSection item={item} />
              {item.trailerYoutubeId ? (
                <section aria-labelledby="trailer-heading" className="space-y-3">
                  <SectionHeading id="trailer-heading">Trailer</SectionHeading>
                  <TrailerEmbed youtubeId={item.trailerYoutubeId} title={item.title} />
                </section>
              ) : null}
              <ContentWarningsSection warnings={item.contentWarnings} />
              <TakeActionSection actions={item.actions} />
              {related ? <PosterShelf title="Related" items={related} /> : null}
              <NoHostingNote />
            </div>
            <CreditsAside item={item} />
          </div>
        </div>
      </div>
    </>
  );
}
