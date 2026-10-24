import Link from 'next/link';
import { PlaceTypeIcon } from '@/components/places/place-type-icon';
import { Badge } from '@/components/ui/badge';
import { PLACE_TYPE_LABELS, showsVeganLevel, VEGAN_LEVEL_LABELS } from '@/lib/labels';
import type { Place } from '@/lib/types';

/** Approved places for an area or city. Vegan level and type come before the address. */
export function PlaceDirectory({ places }: { places: Place[] }) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {places.map((place) => (
        <li key={place.id}>
          <Link
            href={`/places/${place.slug}`}
            className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-accent"
          >
            <span className="min-w-0">
              <span className="block font-medium">{place.name}</span>
              <span className="mt-2 flex flex-wrap items-center gap-2">
                {showsVeganLevel(place.type) ? (
                  <Badge variant={place.veganLevel === 'full' ? 'default' : 'secondary'}>
                    {VEGAN_LEVEL_LABELS[place.veganLevel]}
                  </Badge>
                ) : null}
                <Badge variant="outline">
                  <PlaceTypeIcon type={place.type} />
                  {PLACE_TYPE_LABELS[place.type]}
                </Badge>
                {place.chain ? <Badge variant="outline">Chain</Badge> : null}
              </span>
            </span>
            {place.city ? (
              <span className="shrink-0 text-sm text-muted-foreground">{place.city}</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
