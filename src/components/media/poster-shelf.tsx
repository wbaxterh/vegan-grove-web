import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useId } from 'react';
import type { MediaItem } from '@/lib/types';
import { PosterCard } from './poster-card';
import { ShelfScroller } from './shelf-scroller';

type PosterShelfProps = {
  title: string;
  description?: string | null;
  /** "See all" target: a collection page or a filtered library view. */
  seeAllHref?: string | null;
  items: MediaItem[];
};

const SHELF_SIZES = '(min-width: 1024px) 11rem, (min-width: 640px) 10rem, 8.5rem';

/** A named row of 2:3 posters that scrolls sideways. Empty rows render nothing. */
export function PosterShelf({ title, description, seeAllHref, items }: PosterShelfProps) {
  const headingId = useId();
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId} data-testid="media-shelf" className="space-y-3">
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id={headingId} className="font-heading text-lg font-semibold sm:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-vg-accent-2 hover:underline"
          >
            See all
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </header>
      <ShelfScroller label={title}>
        {items.map((item) => (
          <li key={item.id} className="w-34 shrink-0 snap-start sm:w-40 lg:w-44">
            <PosterCard item={item} sizes={SHELF_SIZES} />
          </li>
        ))}
      </ShelfScroller>
    </section>
  );
}
