import type { Metadata } from 'next';
import Link from 'next/link';
import { PlacesMapIsland } from '@/components/places/places-map-island';
import { Screen } from '@/components/screen';

export const metadata: Metadata = {
  title: 'Places',
  description:
    'Sanctuaries, vegan restaurants, cafes, groceries, and shops across Southern California.',
};

export default function PlacesPage() {
  return (
    <Screen
      label="Places"
      title="Sanctuaries and vegan places"
      context="Move the map to search the area you are looking at. Your location stays in your browser; the server only ever sees the box on the map."
      action={<PlacesMapIsland />}
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
          </ul>
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
