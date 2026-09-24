'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { Locate } from 'lucide-react';
import { setWorkerUrl } from 'maplibre-gl';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { Map as MapLibreMap, type MapRef, Marker, NavigationControl } from 'react-map-gl/maplibre';
import { Button } from '@/components/ui/button';
import { apiFetch, type ListResponse } from '@/lib/api';
import type { Place } from '@/lib/types';
import { cn } from '@/lib/utils';

// Self-hosted worker (see scripts/copy-maplibre-worker.mjs): the bundled one
// cannot resolve its shared chunk under Turbopack's hashed file names.
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

/** OpenFreeMap: no API key, no cookies, no per-user data on the tile server. */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Long Beach, the first grove. Device location never leaves the browser (privacy rule 3). */
const INITIAL_VIEW = { longitude: -118.19, latitude: 33.83, zoom: 9 };

type Status = 'idle' | 'loading' | 'ready' | 'unavailable';

export default function PlacesMap() {
  const mapRef = useRef<MapRef>(null);
  const requestId = useRef(0);
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>('idle');

  const loadVisible = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
      .map((n) => n.toFixed(5))
      .join(',');

    requestId.current += 1;
    const id = requestId.current;
    setStatus('loading');
    try {
      const data = await apiFetch<ListResponse<Place>>(`/places?bbox=${bbox}`);
      if (id !== requestId.current) return;
      setPlaces(data.items);
      setStatus('ready');
    } catch {
      if (id !== requestId.current) return;
      setPlaces([]);
      setStatus('unavailable');
    }
  }, []);

  const locate = () => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        mapRef.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 12 }),
      () => undefined,
      { enableHighAccuracy: false, timeout: 8_000 },
    );
  };

  return (
    <div className="relative h-full w-full">
      <MapLibreMap
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        mapStyle={STYLE_URL}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        onLoad={loadVisible}
        onMoveEnd={loadVisible}
      >
        <NavigationControl position="top-right" showCompass={false} />
        {places.map((place) => (
          <Marker
            key={place.id}
            longitude={place.location.coordinates[0]}
            latitude={place.location.coordinates[1]}
            anchor="center"
          >
            <Link
              href={`/places/${place.slug}`}
              title={place.name}
              aria-label={place.name}
              className={cn(
                'block size-3.5 rounded-full ring-2 ring-vg-bg shadow-[0_0_12px_var(--vg-primary)]',
                place.veganLevel === 'full' ? 'bg-vg-primary' : 'bg-vg-accent-2',
              )}
            />
          </Marker>
        ))}
      </MapLibreMap>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
        <p
          role="status"
          className="rounded-md border border-border bg-background/90 px-2.5 py-1 font-mono text-xs text-muted-foreground backdrop-blur"
        >
          {status === 'loading' && 'Searching this area'}
          {status === 'ready' &&
            `${places.length} ${places.length === 1 ? 'place' : 'places'} here`}
          {status === 'unavailable' && 'Places are unavailable: the API did not answer'}
          {status === 'idle' && 'Move the map to search'}
        </p>
        <Button className="pointer-events-auto" variant="outline" size="sm" onClick={locate}>
          <Locate data-icon="inline-start" aria-hidden="true" />
          Near me
        </Button>
      </div>
    </div>
  );
}
