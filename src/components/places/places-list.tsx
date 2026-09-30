'use client';

import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PLACE_TYPE_LABELS, showsVeganLevel, VEGAN_LEVEL_LABELS } from '@/lib/labels';
import type { Place } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PlaceTypeIcon } from './place-type-icon';

export type ListStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

type PlacesListProps = {
  items: Place[];
  status: ListStatus;
  /** True when the filters exclude everything, so nothing was asked for. */
  filtersEmpty: boolean;
  selectedId: string | null;
  onSelect: (place: Place) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  className?: string;
};

type ListState = 'empty-filters' | 'unavailable' | 'searching' | 'none' | 'ready';

function stateOf(status: ListStatus, filtersEmpty: boolean, count: number): ListState {
  if (filtersEmpty) return 'empty-filters';
  if (status === 'unavailable') return 'unavailable';
  if (count > 0) return 'ready';
  return status === 'ready' ? 'none' : 'searching';
}

const SUMMARY: Record<Exclude<ListState, 'ready'>, string> = {
  'empty-filters': 'Nothing selected',
  unavailable: 'Unavailable',
  searching: 'Searching',
  none: 'No places in view',
};

const MESSAGE: Record<Exclude<ListState, 'ready'>, string> = {
  'empty-filters': 'Turn on a vegan level and at least one type to see places.',
  unavailable: 'Places are unavailable: the API did not answer.',
  searching: 'Searching this area.',
  none: 'No places in this view. Move the map, zoom out, or widen the filters.',
};

function PlaceRow({
  place,
  selected,
  onSelect,
}: {
  place: Place;
  selected: boolean;
  onSelect: (place: Place) => void;
}) {
  const full = place.veganLevel === 'full';
  return (
    <button
      type="button"
      data-place-row={place.id}
      aria-pressed={selected}
      onClick={() => onSelect(place)}
      className={cn(
        'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected && 'bg-accent ring-1 ring-vg-primary/40',
      )}
    >
      <PlaceTypeIcon
        type={place.type}
        className={cn('mt-0.5 size-4 shrink-0', full ? 'text-vg-primary' : 'text-vg-accent-2')}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{place.name}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {showsVeganLevel(place.type) ? (
            <Badge variant={full ? 'default' : 'secondary'}>
              {VEGAN_LEVEL_LABELS[place.veganLevel]}
            </Badge>
          ) : null}
          <span>{PLACE_TYPE_LABELS[place.type]}</span>
          {place.chain ? <Badge variant="outline">Chain</Badge> : null}
        </span>
      </span>
    </button>
  );
}

/** The places on the map as a list: fully vegan first, one button per row, honest when empty. */
export function PlacesList({
  items,
  status,
  filtersEmpty,
  selectedId,
  onSelect,
  hasMore,
  loadingMore,
  onLoadMore,
  className,
}: PlacesListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the selected row in view when the selection came from the map.
  useEffect(() => {
    if (!selectedId) return;
    listRef.current
      ?.querySelector(`[data-place-row="${selectedId}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  const count = items.length;
  const state = stateOf(status, filtersEmpty, count);
  const summary =
    state === 'ready'
      ? `${count} ${count === 1 ? 'place' : 'places'}, fully vegan first`
      : SUMMARY[state];

  return (
    <section
      aria-label="Places on the map"
      className={cn('flex min-h-0 flex-col rounded-xl border border-border bg-card', className)}
    >
      <header className="border-b border-border px-3 py-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">In view</p>
        <p className="mt-0.5 text-xs text-muted-foreground" aria-live="polite">
          {summary}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {state === 'ready' ? (
          <ul ref={listRef} className="space-y-0.5">
            {items.map((place) => (
              <li key={place.id}>
                <PlaceRow place={place} selected={place.id === selectedId} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">{MESSAGE[state]}</p>
        )}
        {hasMore && state === 'ready' ? (
          <div className="p-1.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading' : 'Load more'}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
