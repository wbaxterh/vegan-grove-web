import {
  Building2,
  Coffee,
  Leaf,
  type LucideIcon,
  MapPin,
  ShoppingBasket,
  Sprout,
  Store,
  Utensils,
} from 'lucide-react';
import type { PlaceType } from '@/lib/types';

/** One icon per place type, shared by the markers, the side list, and the detail page. */
export const PLACE_TYPE_ICONS: Record<PlaceType, LucideIcon> = {
  sanctuary: Leaf,
  garden: Sprout,
  restaurant: Utensils,
  cafe: Coffee,
  grocery: ShoppingBasket,
  shop: Store,
  organization: Building2,
  venue: MapPin,
};

/** Sanctuaries and gardens are the point of the map, so their markers carry the icon. */
export function isHighlightedType(type: PlaceType): boolean {
  return type === 'sanctuary' || type === 'garden';
}

export function PlaceTypeIcon({ type, className }: { type: PlaceType; className?: string }) {
  const Icon = PLACE_TYPE_ICONS[type];
  return <Icon className={className} aria-hidden="true" />;
}
