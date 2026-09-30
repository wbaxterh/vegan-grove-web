'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch, type ListResponse } from '@/lib/api';
import { normalizeMediaItem } from '@/lib/media-library';
import type { MediaItem } from '@/lib/types';
import { PosterGrid } from './poster-grid';

/**
 * Where the next page comes from. The public library reads the API directly from the
 * browser; the watchlist goes through this site's own route so the session stays a cookie.
 */
export type GridSource = { kind: 'library'; query: string } | { kind: 'watchlist' };

type MediaBrowseGridProps = {
  initialItems: MediaItem[];
  initialCursor: string | null;
  source: GridSource;
};

async function fetchPage(source: GridSource, cursor: string): Promise<ListResponse<MediaItem>> {
  if (source.kind === 'library') {
    return apiFetch<ListResponse<MediaItem>>(
      `/media?${source.query}&cursor=${encodeURIComponent(cursor)}`,
    );
  }
  const response = await fetch(`/api/me/watchlist?cursor=${encodeURIComponent(cursor)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`http_${response.status}`);
  return (await response.json()) as ListResponse<MediaItem>;
}

/**
 * The poster grid with a cursor "Load more". The first page arrives server-rendered; the
 * parent keys this component by its query so a filter change starts the list over.
 */
export function MediaBrowseGrid({ initialItems, initialCursor, source }: MediaBrowseGridProps) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadMore = async () => {
    if (!cursor || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const data = await fetchPage(source, cursor);
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        const fresh = (data.items ?? [])
          .map(normalizeMediaItem)
          .filter((item) => !seen.has(item.id));
        return [...current, ...fresh];
      });
      setCursor(data.nextCursor ?? null);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PosterGrid items={items} />
      {cursor ? (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={busy}>
            {busy ? 'Loading' : 'Load more'}
          </Button>
        </div>
      ) : null}
      {failed ? (
        <p role="status" className="mt-3 text-center text-sm text-muted-foreground">
          Could not load more titles. Try again in a moment.
        </p>
      ) : null}
    </div>
  );
}
