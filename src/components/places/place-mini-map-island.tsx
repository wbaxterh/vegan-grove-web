'use client';

import dynamic from 'next/dynamic';
import type { PlaceMiniMapProps } from './place-mini-map';

const PlaceMiniMap = dynamic(() => import('./place-mini-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
      Loading map
    </div>
  ),
});

/**
 * Browser-only preview for the detail page; the server renders the frame, the label, and the
 * tile attribution OpenFreeMap asks for (its control is off, see place-mini-map.tsx).
 */
export function PlaceMiniMapIsland({ name, ...props }: PlaceMiniMapProps & { name: string }) {
  return (
    <figure className="space-y-1.5">
      <div
        role="img"
        aria-label={`Map around ${name}`}
        data-testid="place-mini-map"
        className="h-48 w-full overflow-hidden rounded-lg border border-border bg-muted"
      >
        <PlaceMiniMap {...props} />
      </div>
      <figcaption className="text-muted-foreground text-xs">
        Map tiles by{' '}
        <a href="https://openfreemap.org" rel="noreferrer" className="underline">
          OpenFreeMap
        </a>
        , &copy;{' '}
        <a href="https://www.openmaptiles.org/" rel="noreferrer" className="underline">
          OpenMapTiles
        </a>
        , data &copy;{' '}
        <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" className="underline">
          OpenStreetMap contributors
        </a>
        .
      </figcaption>
    </figure>
  );
}
