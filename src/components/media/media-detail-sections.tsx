import {
  BookOpen,
  ExternalLink,
  GraduationCap,
  HandCoins,
  Handshake,
  HeartHandshake,
  type LucideIcon,
  PenLine,
  Star,
  TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { MEDIA_KIND_LABELS } from '@/lib/labels';
import { usableImageUrl } from '@/lib/media';
import {
  DEFAULT_MEDIA_FILTERS,
  externalLinks,
  hasJustWatchAttribution,
  kickerParts,
  languageName,
  mediaHref,
  topicTags,
} from '@/lib/media-library';
import type { MediaAction, MediaActionType, MediaItem, MediaKind, MediaViewer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AccessBadge } from './access-badge';
import { GeneratedPoster } from './generated-poster';
import { MediaActions } from './media-actions';
import { PosterImage } from './poster-image';

/** The pieces of `/media/[slug]`, in page order. Each one renders nothing when it has nothing to say. */

const BACKDROP_SIZES = '(min-width: 1536px) 1536px, 100vw';
const POSTER_SIZES = '(min-width: 768px) 14rem, 10rem';

const ACTION_TYPE_LABELS: Record<MediaActionType, string> = {
  petition: 'Petition',
  donate: 'Donate',
  pledge: 'Pledge',
  volunteer: 'Volunteer',
  guide: 'Guide',
  learn: 'Learn more',
};

const ACTION_TYPE_ICONS: Record<MediaActionType, LucideIcon> = {
  petition: PenLine,
  donate: HandCoins,
  pledge: HeartHandshake,
  volunteer: Handshake,
  guide: BookOpen,
  learn: GraduationCap,
};

export function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="font-heading text-lg font-semibold sm:text-xl">
      {children}
    </h2>
  );
}

function GradientBand() {
  return (
    <div
      className="absolute inset-0 bg-linear-to-br from-vg-primary/35 via-card via-45% to-vg-accent-2/15"
      aria-hidden="true"
    />
  );
}

/** Full-bleed backdrop behind the header, fading into the page background. */
export function BackdropBand({ item }: { item: MediaItem }) {
  const backdrop = usableImageUrl(item.backdropUrl);
  return (
    <div
      data-testid="media-backdrop"
      className="absolute inset-x-0 top-0 h-[22rem] overflow-hidden sm:h-[28rem]"
      aria-hidden="true"
    >
      {backdrop ? (
        <PosterImage
          src={backdrop}
          alt=""
          sizes={BACKDROP_SIZES}
          priority
          fallback={<GradientBand />}
        />
      ) : (
        <GradientBand />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/75 to-background/25" />
    </div>
  );
}

export function DetailBreadcrumb({ kind }: { kind: MediaKind }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 font-mono text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/media" className="hover:text-foreground hover:underline">
            Media library
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link
            href={mediaHref({ ...DEFAULT_MEDIA_FILTERS, kind })}
            className="hover:text-foreground hover:underline"
          >
            {MEDIA_KIND_LABELS[kind]}
          </Link>
        </li>
      </ol>
    </nav>
  );
}

type DetailHeaderProps = { item: MediaItem; viewer: MediaViewer | null; signedIn: boolean };

/** Poster, kicker, title, tagline, rating, and the action row. */
export function DetailHeader({ item, viewer, signedIn }: DetailHeaderProps) {
  const poster = usableImageUrl(item.posterUrl);
  return (
    <header className="grid gap-6 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-end md:grid-cols-[14rem_minmax(0,1fr)]">
      <div
        data-testid="media-poster"
        className="relative aspect-[2/3] w-40 overflow-hidden rounded-lg shadow-2xl ring-1 ring-foreground/10 sm:w-full"
      >
        {poster ? (
          <PosterImage
            src={poster}
            alt={`${item.title} poster`}
            sizes={POSTER_SIZES}
            priority
            fallback={<GeneratedPoster item={item} variant="header" />}
          />
        ) : (
          <GeneratedPoster item={item} variant="header" />
        )}
      </div>
      <div className="min-w-0 space-y-3">
        <p
          data-testid="media-kicker"
          className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary"
        >
          <span aria-hidden="true">{'// '}</span>
          {kickerParts(item).join(' / ')}
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-5xl dark:vg-glow">
          {item.title}
        </h1>
        {item.tagline ? <p className="text-lg text-muted-foreground">{item.tagline}</p> : null}
        {item.rating !== null ? (
          <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <Star className="size-3.5 fill-current text-vg-primary" aria-hidden="true" />
            {item.rating.toFixed(1)} on TMDB
            {item.ratingCount ? ` from ${item.ratingCount.toLocaleString('en-US')} ratings` : ''}
          </p>
        ) : null}
        <MediaActions
          mediaId={item.id}
          slug={item.slug}
          title={item.title}
          signedIn={signedIn}
          viewer={viewer}
          stats={item.stats}
        />
      </div>
    </header>
  );
}

export function SynopsisSection({ item }: { item: MediaItem }) {
  const tags = topicTags(item);
  return (
    <section aria-labelledby="synopsis-heading" className="space-y-4">
      <h2 id="synopsis-heading" className="sr-only">
        Synopsis
      </h2>
      {item.synopsis ? (
        <p className="max-w-3xl text-base leading-relaxed sm:text-lg">{item.synopsis}</p>
      ) : (
        <p className="text-muted-foreground">No synopsis yet.</p>
      )}
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Topics">
          {tags.map((tag) => (
            <li key={tag}>
              <Badge
                variant="secondary"
                className="font-mono"
                render={<Link href={mediaHref({ ...DEFAULT_MEDIA_FILTERS, tag })} />}
              >
                #{tag}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Every provider, with its access badge; the JustWatch line when the data came from there. */
export function WatchSection({ item }: { item: MediaItem }) {
  return (
    <section id="watch" aria-labelledby="watch-heading" className="space-y-3">
      <SectionHeading id="watch-heading">Where to watch</SectionHeading>
      {item.watchLinks.length > 0 ? (
        <ul
          className="divide-y divide-border rounded-xl border border-border bg-card"
          data-testid="watch-links"
        >
          {item.watchLinks.map((link) => (
            <li key={`${link.provider}:${link.url}`}>
              <a
                href={link.url}
                rel="noreferrer"
                target="_blank"
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="truncate font-medium">{link.provider}</span>
                  <AccessBadge access={link.access} />
                </span>
                <ExternalLink
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No public watch link yet.
          {item.officialSite ? ' The official site is the place to start.' : ''}
        </p>
      )}
      {hasJustWatchAttribution(item) ? (
        <p className="font-mono text-xs text-muted-foreground">
          Watch providers data by JustWatch.
        </p>
      ) : null}
    </section>
  );
}

export function ContentWarningsSection({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <section
      aria-labelledby="warnings-heading"
      data-testid="content-warnings"
      className="rounded-xl border border-vg-accent/40 bg-card p-4"
    >
      <h2
        id="warnings-heading"
        className="flex items-center gap-2 font-heading text-base font-semibold"
      >
        <TriangleAlert className="size-4 text-vg-accent" aria-hidden="true" />
        Content warnings
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {warnings.map((warning) => (
          <li key={warning}>
            <Badge variant="outline">{warning}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActionTile({ action }: { action: MediaAction }) {
  const Icon = ACTION_TYPE_ICONS[action.type] ?? GraduationCap;
  return (
    <a
      href={action.url}
      rel="noreferrer"
      target="_blank"
      className="flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm transition-colors hover:border-vg-primary/60 hover:bg-muted"
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-vg-primary" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block font-medium">{action.label}</span>
        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
          {ACTION_TYPE_LABELS[action.type] ?? action.type}
          {action.org ? ` / ${action.org}` : ''}
        </span>
      </span>
      <ExternalLink className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </a>
  );
}

/** The point of the library: what to do once the credits roll. */
export function TakeActionSection({ actions }: { actions: MediaAction[] }) {
  if (actions.length === 0) return null;
  return (
    <section aria-labelledby="actions-heading" data-testid="take-action" className="space-y-3">
      <SectionHeading id="actions-heading">Take action</SectionHeading>
      <p className="text-sm text-muted-foreground">
        The film is the start. These are the next steps its makers and the organisations behind it
        ask for.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <li key={`${action.type}:${action.url}`}>
            <ActionTile action={action} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CreditRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {term}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function ReleasedRow({ item }: { item: MediaItem }) {
  if (item.releaseDate) {
    return (
      <CreditRow term="Released">
        <time dateTime={item.releaseDate}>{item.releaseDate}</time>
      </CreditRow>
    );
  }
  return item.year ? <CreditRow term="Released">{item.year}</CreditRow> : null;
}

/** The support column: who made it, what it is, and where else it lives. */
export function CreditsAside({ item }: { item: MediaItem }) {
  const links = externalLinks(item);
  const language = languageName(item.originalLanguage);
  const bare = item.directors.length === 0 && item.featuring.length === 0 && links.length === 0;

  return (
    <aside
      data-testid="media-credits"
      className="h-fit space-y-4 rounded-xl border border-border bg-card p-5 text-sm lg:sticky lg:top-24"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Credits</p>
      <dl className="space-y-3">
        {item.directors.length > 0 ? (
          <CreditRow term="Directed by">{item.directors.join(', ')}</CreditRow>
        ) : null}
        {item.featuring.length > 0 ? (
          <CreditRow term="Featuring">{item.featuring.join(', ')}</CreditRow>
        ) : null}
        {item.genres.length > 0 ? (
          <CreditRow term="Genres">{item.genres.join(', ')}</CreditRow>
        ) : null}
        {language ? <CreditRow term="Language">{language}</CreditRow> : null}
        <ReleasedRow item={item} />
        {links.length > 0 ? (
          <CreditRow term="Elsewhere">
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-vg-accent-2 hover:underline"
                  >
                    {link.label}
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </CreditRow>
        ) : null}
      </dl>
      {bare ? (
        <p className="text-muted-foreground">Credits are still being gathered for this title.</p>
      ) : null}
      {item.tags.includes('tmdb') ? (
        <p className="text-xs text-muted-foreground">
          Details from TMDB. This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
      ) : null}
      <Link
        href="/media"
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
      >
        Back to the library
      </Link>
    </aside>
  );
}
