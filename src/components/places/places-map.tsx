'use client';

import { Locate } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import {
  type MapLayerMouseEvent,
  Map as MapLibreMap,
  type MapRef,
  Marker,
  NavigationControl,
  Popup,
} from 'react-map-gl/maplibre';
import { Button } from '@/components/ui/button';
import { PLACE_TYPE_LABELS, VEGAN_LEVEL_LABELS } from '@/lib/labels';
import type { MapPin, Place } from '@/lib/types';
import { INITIAL_VIEW, STYLE_URL } from './maplibre';
import { MarkerGlyph, markerClassName } from './place-marker';
import { PlacePopup } from './place-popup';

export type PinsStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

/** A request from the side list to move the camera; `key` makes repeat requests distinct. */
export type FlyRequest = { lng: number; lat: number; key: number };

export type PlacesMapProps = {
  pins: MapPin[];
  status: PinsStatus;
  selected: { pin: MapPin; place?: Place } | null;
  onSelect: (pin: MapPin | null) => void;
  /** Called with `w,s,e,n` on load and, debounced, after every move. */
  onBboxChange: (bbox: string) => void;
  flyTo: FlyRequest | null;
};

const MOVE_DEBOUNCE_MS = 300;
const Z_SELECTED = { zIndex: 2 };
const Z_DEFAULT = { zIndex: 0 };

function bboxOf(map: MapRef): string {
  const bounds = map.getBounds();
  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
    .map((n) => n.toFixed(5))
    .join(',');
}

export default function PlacesMap({
  pins,
  status,
  selected,
  onSelect,
  onBboxChange,
  flyTo,
}: PlacesMapProps) {
  const mapRef = useRef<MapRef>(null);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announced = useRef(false);

  const publishBbox = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    announced.current = true;
    onBboxChange(bboxOf(map));
  }, [onBboxChange]);

  const onMoveEnd = useCallback(() => {
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(publishBbox, MOVE_DEBOUNCE_MS);
  }, [publishBbox]);

  // A style that fails to load never fires `load`; the list should still work without tiles.
  const onError = useCallback(() => {
    if (!announced.current) publishBbox();
  }, [publishBbox]);

  useEffect(() => {
    return () => {
      if (moveTimer.current) clearTimeout(moveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!flyTo) return;
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: Math.max(map.getZoom(), 13),
      duration: 700,
    });
  }, [flyTo]);

  // Marker clicks bubble up to the map as well, so a click that started on a pin is not a
  // request to close the popup.
  const onMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest('.maplibregl-marker')) return;
      onSelect(null);
    },
    [onSelect],
  );

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
        onLoad={publishBbox}
        onError={onError}
        onMoveEnd={onMoveEnd}
        onClick={onMapClick}
      >
        <NavigationControl position="top-right" showCompass={false} />
        {pins.map((pin) => {
          const isSelected = pin.id === selected?.pin.id;
          return (
            <Marker
              key={pin.id}
              longitude={pin.location.lng}
              latitude={pin.location.lat}
              anchor="center"
              style={isSelected ? Z_SELECTED : Z_DEFAULT}
            >
              <button
                type="button"
                data-place-marker={pin.id}
                aria-label={`${pin.name}, ${VEGAN_LEVEL_LABELS[pin.veganLevel].toLowerCase()} ${PLACE_TYPE_LABELS[pin.type].toLowerCase()}`}
                aria-expanded={isSelected}
                title={pin.name}
                onClick={() => onSelect(isSelected ? null : pin)}
                className={markerClassName(pin.type, pin.veganLevel, isSelected)}
              >
                <MarkerGlyph type={pin.type} />
              </button>
            </Marker>
          );
        })}
        {selected ? (
          <Popup
            key={selected.pin.id}
            longitude={selected.pin.location.lng}
            latitude={selected.pin.location.lat}
            offset={16}
            maxWidth="none"
            closeButton={false}
            closeOnClick={false}
            focusAfterOpen={false}
          >
            <PlacePopup pin={selected.pin} place={selected.place} onClose={() => onSelect(null)} />
          </Popup>
        ) : null}
      </MapLibreMap>

      {/* Top-left: the only corner the zoom control and the (initially expanded) attribution leave free. */}
      <div className="pointer-events-none absolute top-3 left-3 flex max-w-[calc(100%-4rem)] flex-wrap items-center gap-2">
        <Button
          className="pointer-events-auto bg-background/90 backdrop-blur hover:bg-background dark:bg-background/90 dark:hover:bg-background"
          variant="outline"
          size="sm"
          onClick={locate}
        >
          <Locate data-icon="inline-start" aria-hidden="true" />
          Near me
        </Button>
        <p
          role="status"
          className="rounded-md border border-border bg-background/90 px-2.5 py-1 font-mono text-xs text-muted-foreground backdrop-blur"
        >
          {status === 'loading' && 'Searching this area'}
          {status === 'ready' && `${pins.length} ${pins.length === 1 ? 'place' : 'places'} here`}
          {status === 'unavailable' && 'Places are unavailable: the API did not answer'}
          {status === 'idle' && 'Move the map to search'}
        </p>
      </div>
    </div>
  );
}
