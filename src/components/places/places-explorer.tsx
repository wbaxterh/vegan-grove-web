'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, type ListResponse } from '@/lib/api';
import {
  filtersAreEmpty,
  type PlaceFilters,
  parsePlaceFilters,
  placesQuery,
  serializePlaceFilters,
} from '@/lib/place-filters';
import type { MapPin, Place } from '@/lib/types';
import { PlaceFilterChips } from './place-filter-chips';
import { PlacesList } from './places-list';
import type { FlyRequest, PinsStatus } from './places-map';
import { PlacesMapIsland } from './places-map-island';

/**
 * Owns everything the map screen shares: the filters (read from and written to the URL), the
 * bounding box the map reports, the pins and the list for that box, and the selection that
 * links a marker to its row. Two requests per view: `map-pins` is slim and draws every dot,
 * `/places` carries the details the list and the popup show.
 */

function pinOf(place: Place): MapPin {
  return {
    id: place.id,
    slug: place.slug,
    name: place.name,
    type: place.type,
    veganLevel: place.veganLevel,
    chain: place.chain === true,
    location: place.location,
  };
}

/** Fully vegan first (spec section 9), API order otherwise. `sort` is stable. */
function veganFirst(items: Place[]): Place[] {
  return [...items].sort(
    (a, b) => Number(a.veganLevel !== 'full') - Number(b.veganLevel !== 'full'),
  );
}

export function PlacesExplorer() {
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parsePlaceFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const empty = filtersAreEmpty(filters);

  const [bbox, setBbox] = useState<string | null>(null);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [pinsStatus, setPinsStatus] = useState<PinsStatus>('idle');
  const [items, setItems] = useState<Place[]>([]);
  const [listStatus, setListStatus] = useState<PinsStatus>('idle');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<FlyRequest | null>(null);
  const requestId = useRef(0);

  // The URL is the source of truth for filters; replaceState keeps the page and scroll
  // position and Next syncs useSearchParams from it.
  const applyFilters = useCallback((next: PlaceFilters) => {
    const query = serializePlaceFilters(next);
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    setSelectedId(null);
  }, []);

  useEffect(() => {
    if (!bbox) return;
    requestId.current += 1;
    const id = requestId.current;
    const fresh = () => id === requestId.current;

    if (empty) {
      setPins([]);
      setItems([]);
      setNextCursor(null);
      setPinsStatus('ready');
      setListStatus('ready');
      return;
    }

    const query = placesQuery(filters, bbox).toString();
    setPinsStatus('loading');
    setListStatus('loading');

    apiFetch<{ items: MapPin[] }>(`/places/map-pins?${query}`).then(
      (data) => {
        if (!fresh()) return;
        setPins(data.items ?? []);
        setPinsStatus('ready');
      },
      () => {
        if (!fresh()) return;
        setPins([]);
        setPinsStatus('unavailable');
      },
    );

    apiFetch<ListResponse<Place>>(`/places?${query}`).then(
      (data) => {
        if (!fresh()) return;
        setItems(veganFirst(data.items ?? []));
        setNextCursor(data.nextCursor ?? null);
        setListStatus('ready');
      },
      () => {
        if (!fresh()) return;
        setItems([]);
        setNextCursor(null);
        setListStatus('unavailable');
      },
    );
  }, [bbox, filters, empty]);

  const loadMore = useCallback(async () => {
    if (!bbox || !nextCursor || loadingMore) return;
    const id = requestId.current;
    const query = placesQuery(filters, bbox);
    query.set('cursor', nextCursor);
    setLoadingMore(true);
    try {
      const data = await apiFetch<ListResponse<Place>>(`/places?${query.toString()}`);
      if (id !== requestId.current) return;
      setItems((current) => veganFirst([...current, ...(data.items ?? [])]));
      setNextCursor(data.nextCursor ?? null);
    } catch {
      if (id !== requestId.current) return;
      setNextCursor(null);
    } finally {
      if (id === requestId.current) setLoadingMore(false);
    }
  }, [bbox, nextCursor, loadingMore, filters]);

  const selectPin = useCallback((pin: MapPin | null) => setSelectedId(pin?.id ?? null), []);

  const selectFromList = useCallback((place: Place) => {
    setSelectedId(place.id);
    setFlyTo({ lng: place.location.lng, lat: place.location.lat, key: Date.now() });
  }, []);

  // Escape closes the popup from anywhere on the screen and hands focus back to the marker.
  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSelectedId(null);
      document
        .querySelector<HTMLElement>(`[data-place-marker="${selectedId}"]`)
        ?.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    const place = items.find((item) => item.id === selectedId);
    const pin = pins.find((item) => item.id === selectedId) ?? (place ? pinOf(place) : null);
    return pin ? { pin, place } : null;
  }, [selectedId, pins, items]);

  return (
    <div className="space-y-4">
      <PlaceFilterChips filters={filters} onChange={applyFilters} />
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <PlacesMapIsland
          pins={pins}
          status={pinsStatus}
          selected={selected}
          onSelect={selectPin}
          onBboxChange={setBbox}
          flyTo={flyTo}
        />
        <PlacesList
          items={items}
          status={listStatus}
          filtersEmpty={empty}
          selectedId={selected?.pin.id ?? null}
          onSelect={selectFromList}
          hasMore={nextCursor !== null}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          className="h-80 md:h-[60vh] md:min-h-[420px] lg:h-80 lg:min-h-0 xl:h-[60vh] xl:min-h-[420px]"
        />
      </div>
    </div>
  );
}
