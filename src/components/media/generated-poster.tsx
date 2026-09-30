import { MEDIA_KIND_LABELS } from '@/lib/labels';
import type { MediaItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MediaKindIcon } from './media-kind-icon';

type GeneratedPosterProps = {
  item: Pick<MediaItem, 'title' | 'kind' | 'year'>;
  /** `card` is the 2:3 tile; `header` is the larger poster on the detail page. */
  variant?: 'card' | 'header';
  className?: string;
};

/**
 * The poster the library shows until the media CDN exists (contract 10.3): the title set in
 * the display type over the brand gradient, with the kind glyph. It is art, not chrome, so
 * it keeps the dark-mode tokens in both themes the way a real poster would.
 */
export function GeneratedPoster({ item, variant = 'card', className }: GeneratedPosterProps) {
  const header = variant === 'header';
  return (
    <div
      data-testid="poster-fallback"
      className={cn(
        'relative flex h-full w-full flex-col justify-end overflow-hidden bg-vg-bg text-vg-text',
        header ? 'p-5' : 'p-3',
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-linear-to-br from-vg-primary-light via-vg-surface via-55% to-vg-bg"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_11px,var(--vg-text)_11px_12px)] opacity-[0.06]"
        aria-hidden="true"
      />
      <MediaKindIcon
        kind={item.kind}
        className={cn(
          'absolute text-vg-primary-dark/30',
          header ? '-top-6 -right-6 size-40' : '-top-4 -right-4 size-24',
        )}
      />
      <p
        className={cn(
          'relative font-heading font-bold leading-tight text-balance',
          header ? 'line-clamp-5 text-2xl' : 'line-clamp-4 text-sm sm:text-base',
        )}
      >
        {item.title}
      </p>
      <p
        className={cn(
          'relative mt-1.5 font-mono uppercase tracking-[0.2em] text-vg-text/70',
          header ? 'text-xs' : 'text-[10px]',
        )}
      >
        {MEDIA_KIND_LABELS[item.kind]}
        {item.year ? ` ${item.year}` : ''}
      </p>
    </div>
  );
}
