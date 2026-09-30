import type { MediaItem } from '@/lib/types';
import { PosterCard } from './poster-card';

const GRID_SIZES = '(min-width: 1024px) 15vw, (min-width: 640px) 30vw, 45vw';

/** The responsive 2:3 grid used by the browse view, a collection, and the watchlist. */
export function PosterGrid({ items }: { items: MediaItem[] }) {
  return (
    <ul
      data-testid="media-grid"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6"
    >
      {items.map((item) => (
        <li key={item.id}>
          <PosterCard item={item} sizes={GRID_SIZES} />
        </li>
      ))}
    </ul>
  );
}
