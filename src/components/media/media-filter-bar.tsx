'use client';

import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { MEDIA_KIND_LABELS } from '@/lib/labels';
import {
  MEDIA_KIND_ORDER,
  MEDIA_SORT_OPTIONS,
  type MediaFilters,
  type MediaSort,
  mediaHref,
  normalizeQuery,
} from '@/lib/media-library';
import type { MediaKind } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MediaKindIcon } from './media-kind-icon';

const SEARCH_DEBOUNCE_MS = 250;

type ChipProps = { pressed: boolean; onClick: () => void; children: React.ReactNode };

function Chip({ pressed, onClick, children }: ChipProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={pressed ? 'default' : 'outline'}
      aria-pressed={pressed}
      onClick={onClick}
      className="rounded-full"
    >
      {children}
    </Button>
  );
}

/**
 * Search, kind pills, and sort. The URL is the only state: every change is a `router.replace`
 * to `/media?q=&kind=&tag=&sort=`, and the server re-renders the grid for it. The search box
 * keeps its own text so typing stays smooth while the navigation catches up.
 */
export function MediaFilterBar({ filters }: { filters: MediaFilters }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(filters.q);
  const lastPushed = useRef(filters.q);
  const timer = useRef<number | null>(null);

  // A back/forward navigation changes `q` under us; our own navigations do not.
  useEffect(() => {
    if (filters.q !== lastPushed.current) {
      lastPushed.current = filters.q;
      setText(filters.q);
    }
  }, [filters.q]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const navigate = (next: MediaFilters) => {
    lastPushed.current = next.q;
    startTransition(() => router.replace(mediaHref(next), { scroll: false }));
  };

  const submitSearch = (value: string) => navigate({ ...filters, q: normalizeQuery(value) });

  const onTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setText(value);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => submitSearch(value), SEARCH_DEBOUNCE_MS);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (timer.current) window.clearTimeout(timer.current);
    submitSearch(text);
  };

  const setKind = (kind: MediaKind | null) => navigate({ ...filters, kind });

  return (
    <div className="space-y-3" data-pending={pending ? 'true' : undefined}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <search className="relative flex-1">
          <form onSubmit={onSubmit}>
            <label htmlFor="media-search" className="sr-only">
              Search the library
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="media-search"
              type="search"
              name="q"
              placeholder="Search titles, people, and topics"
              autoComplete="off"
              value={text}
              onChange={onTextChange}
              className="pl-8"
            />
          </form>
        </search>
        <label
          htmlFor="media-sort"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <span className="font-mono text-xs uppercase tracking-[0.2em]">Sort</span>
          <NativeSelect
            id="media-sort"
            value={filters.sort}
            onChange={(event) => navigate({ ...filters, sort: event.target.value as MediaSort })}
          >
            {MEDIA_SORT_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      </div>
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="sr-only">Kind</legend>
        <Chip pressed={filters.kind === null} onClick={() => setKind(null)}>
          All
        </Chip>
        {MEDIA_KIND_ORDER.map((kind) => {
          const on = filters.kind === kind;
          return (
            <Chip key={kind} pressed={on} onClick={() => setKind(on ? null : kind)}>
              <MediaKindIcon
                kind={kind}
                className={cn('size-3.5', on ? 'text-primary-foreground' : 'text-vg-primary')}
              />
              {MEDIA_KIND_LABELS[kind]}
            </Chip>
          );
        })}
        {filters.tag ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => navigate({ ...filters, tag: null })}
            aria-label={`Remove the ${filters.tag} topic filter`}
            className="rounded-full font-mono"
          >
            #{filters.tag}
            <X data-icon="inline-end" aria-hidden="true" />
          </Button>
        ) : null}
        <span className="ml-auto font-mono text-xs text-muted-foreground" aria-live="polite">
          {pending ? 'Updating' : ''}
        </span>
      </fieldset>
    </div>
  );
}
