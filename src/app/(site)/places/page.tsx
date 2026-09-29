import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PlaceTypeIcon } from '@/components/places/place-type-icon';
import { PlacesExplorer } from '@/components/places/places-explorer';
import { Screen } from '@/components/screen';

export const metadata: Metadata = {
  title: 'Places',
  description:
    'Sanctuaries, community gardens, vegan restaurants, cafes, groceries, and shops across Southern California.',
};

/** Server-rendered stand-in while the client reads the filters from the URL. */
function ExplorerFallback() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-2/3 rounded-full bg-muted" aria-hidden="true" />
      <div className="flex h-[60vh] min-h-[420px] w-full items-center justify-center rounded-xl border border-border bg-card font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Loading map
      </div>
    </div>
  );
}

export default function PlacesPage() {
  return (
    <Screen
      label="Places"
      title="Sanctuaries and vegan places"
      context="Move the map to search the area you are looking at. Fully vegan places show first; add vegan options and chains when you need them. Your location stays in your browser; the server only ever sees the box on the map."
      action={
        <Suspense fallback={<ExplorerFallback />}>
          <PlacesExplorer />
        </Suspense>
      }
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Legend</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-vg-primary" aria-hidden="true" />
              Fully vegan
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-vg-accent-2" aria-hidden="true" />
              Vegan options
            </li>
            <li className="flex items-center gap-2">
              <span
                className="flex size-4 items-center justify-center rounded-sm bg-vg-primary text-vg-bg"
                aria-hidden="true"
              >
                <PlaceTypeIcon type="sanctuary" className="size-3" />
              </span>
              Sanctuary
            </li>
            <li className="flex items-center gap-2">
              <span
                className="flex size-4 items-center justify-center rounded-sm bg-vg-primary text-vg-bg"
                aria-hidden="true"
              >
                <PlaceTypeIcon type="garden" className="size-3" />
              </span>
              Community garden
            </li>
          </ul>
          <p className="text-muted-foreground">
            Chains are hidden until you ask for them. Filters live in the address bar, so a filtered
            map can be shared as a link.
          </p>
          <p className="text-muted-foreground">
            Places come from OpenStreetMap and from members. New submissions are reviewed before
            they appear.
          </p>
          <p>
            Know a place we are missing?{' '}
            <Link href="/login?next=/app/feed" className="text-vg-accent-2 hover:underline">
              Log in to submit it
            </Link>
            .
          </p>
        </>
      }
    />
  );
}
