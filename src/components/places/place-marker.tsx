import type { PlaceType, VeganLevel } from '@/lib/types';
import { cn } from '@/lib/utils';
import { isHighlightedType, PlaceTypeIcon } from './place-type-icon';

/**
 * The visual language of a pin, shared by the places map and the detail preview:
 * fully vegan is the primary green, vegan options the cyan accent, and sanctuaries
 * and gardens trade the dot for a rounded tile carrying their icon.
 */
export function markerClassName(type: PlaceType, level: VeganLevel, selected = false): string {
  const highlighted = isHighlightedType(type);
  return cn(
    'flex items-center justify-center ring-2 ring-vg-bg transition-transform',
    highlighted ? 'size-6 rounded-md' : 'size-3.5 rounded-full',
    level === 'full'
      ? 'bg-vg-primary text-vg-bg shadow-[0_0_12px_var(--vg-primary)]'
      : 'bg-vg-accent-2 text-vg-bg shadow-[0_0_12px_var(--vg-accent-2)]',
    selected && 'scale-125 ring-vg-accent',
  );
}

/** The icon inside a highlighted tile; dots carry nothing. */
export function MarkerGlyph({ type }: { type: PlaceType }) {
  if (!isHighlightedType(type)) return null;
  return <PlaceTypeIcon type={type} className="size-4" />;
}
