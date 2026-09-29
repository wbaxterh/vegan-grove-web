'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PLACE_TYPE_LABELS, PLACE_TYPE_ORDER } from '@/lib/labels';
import type { PlaceFilters } from '@/lib/place-filters';
import type { PlaceType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PlaceTypeIcon } from './place-type-icon';

type ChipProps = {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Classes for the pressed state; the default is the primary green. */
  pressedClassName?: string;
  /** Dimmed instead of outlined when off: for the type chips, where on is the norm. */
  dimWhenOff?: boolean;
};

function Chip({ pressed, onClick, children, pressedClassName, dimWhenOff }: ChipProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={pressed ? 'default' : 'outline'}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'rounded-full',
        pressed && pressedClassName,
        !pressed && dimWhenOff && 'border-dashed text-muted-foreground',
      )}
    >
      {children}
    </Button>
  );
}

type PlaceFilterChipsProps = {
  filters: PlaceFilters;
  onChange: (next: PlaceFilters) => void;
};

/**
 * The filters lean vegan by design (spec section 9): fully vegan on, options and chains off,
 * every type on with sanctuaries and gardens first. Each chip is a toggle button.
 */
export function PlaceFilterChips({ filters, onChange }: PlaceFilterChipsProps) {
  const toggleType = (type: PlaceType) => {
    const types = filters.types.includes(type)
      ? filters.types.filter((current) => current !== type)
      : PLACE_TYPE_ORDER.filter((current) => current === type || filters.types.includes(current));
    onChange({ ...filters, types });
  };

  return (
    <div className="space-y-2">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Vegan level and chains</legend>
        <Chip pressed={filters.full} onClick={() => onChange({ ...filters, full: !filters.full })}>
          Fully vegan
        </Chip>
        <Chip
          pressed={filters.options}
          pressedClassName="bg-vg-accent-2 text-vg-bg hover:bg-vg-accent-2/80"
          onClick={() => onChange({ ...filters, options: !filters.options })}
        >
          Vegan options
        </Chip>
        <span className="hidden w-px self-stretch bg-border sm:block" aria-hidden="true" />
        <Chip
          pressed={filters.chains}
          pressedClassName="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          onClick={() => onChange({ ...filters, chains: !filters.chains })}
        >
          Show chains
        </Chip>
      </fieldset>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Place types</legend>
        {PLACE_TYPE_ORDER.map((type) => {
          const on = filters.types.includes(type);
          return (
            <Chip
              key={type}
              pressed={on}
              dimWhenOff
              pressedClassName="bg-accent text-accent-foreground hover:bg-accent/80"
              onClick={() => toggleType(type)}
            >
              <PlaceTypeIcon
                type={type}
                className={cn('size-3.5', on ? 'text-vg-primary' : 'text-muted-foreground')}
              />
              {PLACE_TYPE_LABELS[type]}
            </Chip>
          );
        })}
      </fieldset>
    </div>
  );
}
