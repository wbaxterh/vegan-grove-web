'use client';

import { ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { hoursLines } from '@/lib/format';
import { PLACE_TYPE_LABELS, VEGAN_LEVEL_LABELS } from '@/lib/labels';
import type { MapPin, Place } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PlaceTypeIcon } from './place-type-icon';

type PlacePopupProps = {
  pin: MapPin;
  /** The full record when the list has it; a pin past the list's first page shows less. */
  place?: Place;
  onClose: () => void;
};

/** What a member needs to decide whether to go: level and type first, then how to get there. */
export function PlacePopup({ pin, place, onClose }: PlacePopupProps) {
  const ref = useRef<HTMLElement>(null);
  const hours = hoursLines(place?.hours);

  // Move focus in so a keyboard user who opened the pin lands on its name; preventScroll keeps
  // the browser from scrolling the map container, which would break MapLibre's positioning.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label={pin.name}
      data-testid="place-popup"
      className="w-64 max-w-[calc(100vw-3rem)] p-3 text-sm outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading font-medium leading-snug">{pin.name}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mt-1 -mr-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge>{VEGAN_LEVEL_LABELS[pin.veganLevel]}</Badge>
        <Badge variant="outline">
          <PlaceTypeIcon type={pin.type} />
          {PLACE_TYPE_LABELS[pin.type]}
        </Badge>
        {pin.chain ? <Badge variant="outline">Chain</Badge> : null}
      </div>
      {place ? (
        <p className="mt-2 text-muted-foreground">
          {place.address}
          <br />
          {place.city}
        </p>
      ) : null}
      {hours.length > 0 ? (
        <ul className="mt-2 space-y-0.5 font-mono text-xs text-muted-foreground">
          {hours.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link href={`/places/${pin.slug}`} className={cn(buttonVariants({ size: 'sm' }))}>
          View place
        </Link>
        {place?.website ? (
          <a
            href={place.website}
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-vg-accent-2 hover:underline"
          >
            Website
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </section>
  );
}
