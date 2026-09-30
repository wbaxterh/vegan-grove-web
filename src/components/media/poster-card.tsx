import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { usableImageUrl } from '@/lib/media';
import { formatRuntime } from '@/lib/media-library';
import type { MediaItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GeneratedPoster } from './generated-poster';
import { PosterImage } from './poster-image';

type PosterCardProps = {
  item: MediaItem;
  /** `sizes` for the poster image, matching the width the card gets in its layout. */
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * A 2:3 poster tile linking to the title. With a poster the title sits on a scrim at the
 * bottom; without one the generated poster carries it. Runtime and "Free" ride on top in
 * both cases because they decide whether someone presses play tonight.
 */
export function PosterCard({ item, sizes, priority, className }: PosterCardProps) {
  const poster = usableImageUrl(item.posterUrl);
  const runtime = formatRuntime(item.runtimeMinutes);
  const free = item.watchLinks.some((link) => link.access === 'free');
  const fallback = <GeneratedPoster item={item} />;

  return (
    <Link
      href={`/media/${item.slug}`}
      data-testid="poster-card"
      className={cn(
        'group/poster relative block aspect-[2/3] w-full overflow-hidden rounded-lg bg-vg-surface ring-1 ring-foreground/10 transition-[box-shadow,transform] hover:ring-vg-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {poster ? (
        <>
          <PosterImage
            src={poster}
            alt=""
            sizes={sizes}
            priority={priority}
            fallback={fallback}
            className="transition-transform duration-300 group-hover/poster:scale-105 motion-reduce:transition-none"
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-linear-to-t from-vg-bg/95 via-vg-bg/60 to-transparent px-2.5 pt-10 pb-2.5 text-vg-text"
            aria-hidden="true"
          >
            <p className="line-clamp-2 text-sm leading-snug font-medium">{item.title}</p>
            {item.year ? (
              <p className="mt-0.5 font-mono text-[10px] text-vg-text/70">{item.year}</p>
            ) : null}
          </div>
          <span className="sr-only">{item.title}</span>
        </>
      ) : (
        fallback
      )}
      <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1">
        {free ? <Badge className="font-mono text-[10px] uppercase">Free</Badge> : <span />}
        {runtime ? (
          <Badge variant="secondary" className="bg-vg-bg/80 font-mono text-[10px] text-vg-text">
            {runtime}
          </Badge>
        ) : null}
      </div>
    </Link>
  );
}
