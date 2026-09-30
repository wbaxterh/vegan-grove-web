'use client';

import { ExternalLink, Info } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { usableImageUrl } from '@/lib/media';
import { kickerParts } from '@/lib/media-library';
import type { MediaItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GeneratedPoster } from './generated-poster';
import { PosterImage } from './poster-image';

const ROTATE_MS = 8_000;
const BACKDROP_SIZES = '(min-width: 1152px) 1152px, 100vw';

/** Brand gradient stand-in for a missing backdrop: green cast on the card surface, legible in both themes. */
function GradientPanel() {
  return (
    <div
      className="absolute inset-0 bg-linear-to-br from-vg-primary/35 via-card via-45% to-vg-accent-2/15"
      aria-hidden="true"
    />
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * The billboard at the top of the library. Rotates through the featured titles every 8 s,
 * pauses while the pointer or focus is on it, and never rotates under reduced motion.
 */
export function HeroBillboard({ items }: { items: MediaItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const rotating = items.length > 1 && !paused && !reduced;

  useEffect(() => {
    if (!rotating) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [rotating, items.length]);

  const item = items[index] ?? items[0];
  if (!item) return null;

  const backdrop = usableImageUrl(item.backdropUrl);
  const poster = usableImageUrl(item.posterUrl);
  const watch = item.watchLinks.find((link) => link.access === 'free') ?? item.watchLinks[0];

  return (
    <section
      data-testid="media-hero"
      data-rotating={rotating ? 'true' : 'false'}
      aria-roledescription="carousel"
      aria-label="Featured titles"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative min-h-[24rem] overflow-hidden rounded-xl border border-border bg-card sm:min-h-[28rem]"
    >
      <div
        key={item.id}
        className="absolute inset-0 animate-in fade-in duration-700 motion-reduce:animate-none"
      >
        {backdrop ? (
          <PosterImage
            src={backdrop}
            alt=""
            sizes={BACKDROP_SIZES}
            priority
            fallback={<GradientPanel />}
          />
        ) : (
          <GradientPanel />
        )}
        <div
          className="absolute inset-0 bg-linear-to-t from-background via-background/75 to-background/5"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 hidden bg-linear-to-r from-background/80 via-background/20 to-transparent sm:block"
          aria-hidden="true"
        />
      </div>

      {!backdrop && poster ? (
        <div className="absolute top-6 right-6 bottom-10 hidden aspect-[2/3] overflow-hidden rounded-lg ring-1 ring-foreground/10 md:block">
          <PosterImage
            src={poster}
            alt=""
            sizes="16rem"
            fallback={<GeneratedPoster item={item} variant="header" />}
          />
        </div>
      ) : null}

      <div className="relative flex min-h-[24rem] max-w-2xl flex-col justify-end gap-3 p-5 sm:min-h-[28rem] sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">
          <span aria-hidden="true">{'// '}</span>
          {kickerParts(item).join(' / ')}
        </p>
        <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-5xl dark:vg-glow">
          {item.title}
        </h2>
        {item.tagline ? (
          <p className="text-base text-muted-foreground sm:text-lg">{item.tagline}</p>
        ) : null}
        {item.synopsis ? (
          <p className="line-clamp-2 max-w-xl text-sm leading-relaxed sm:text-base">
            {item.synopsis}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href={`/media/${item.slug}`} className={cn(buttonVariants({ size: 'lg' }))}>
            <Info data-icon="inline-start" aria-hidden="true" />
            More info
          </Link>
          {watch ? (
            <a
              href={watch.url}
              rel="noreferrer"
              target="_blank"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              {watch.access === 'free' ? 'Watch free on' : 'Watch on'} {watch.provider}
              <ExternalLink data-icon="inline-end" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>

      {items.length > 1 ? (
        <div
          className="absolute right-4 bottom-4 flex gap-1.5"
          role="tablist"
          aria-label="Featured title"
        >
          {items.map((entry, i) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={entry.title}
              onClick={() => setIndex(i)}
              className={cn(
                'size-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                i === index ? 'bg-vg-primary' : 'bg-foreground/30 hover:bg-foreground/60',
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
