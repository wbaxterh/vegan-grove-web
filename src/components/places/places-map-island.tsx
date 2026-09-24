'use client';

import dynamic from 'next/dynamic';

/**
 * MapLibre touches `window` at import time, so the map is a browser-only island. The wrapper
 * is rendered on the server (with the test id) and the map fills it once it loads.
 */
const PlacesMap = dynamic(() => import('./places-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
      Loading map
    </div>
  ),
});

export function PlacesMapIsland() {
  return (
    <div
      data-testid="places-map"
      className="h-[60vh] min-h-[420px] w-full overflow-hidden rounded-xl border border-border bg-card"
    >
      <PlacesMap />
    </div>
  );
}
