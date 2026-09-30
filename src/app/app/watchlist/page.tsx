import { Bookmark } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiUnavailable, EmptyState } from '@/components/empty-state';
import { MediaBrowseGrid } from '@/components/media/media-browse-grid';
import { Screen } from '@/components/screen';
import { buttonVariants } from '@/components/ui/button';
import { loadWatchlist } from '@/lib/media-library.server';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Watchlist', robots: { index: false } };

/** The member's saved titles. The app layout has already validated the session. */
export default async function WatchlistPage() {
  const page = await loadWatchlist();

  return (
    <Screen
      label="Learn"
      title="Watchlist"
      context="Titles you saved for later. This list is private to you, and nothing records what you watch."
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Privacy</p>
          <p className="text-muted-foreground">
            Saving stores the title and the time you saved it, nothing else. There is no watch
            history and no watched flag. Remove a title from its own page.
          </p>
          <p>
            <Link href="/media" className="text-vg-accent-2 hover:underline">
              Browse the library
            </Link>
          </p>
        </>
      }
    >
      {page.unavailable ? (
        <ApiUnavailable what="Your saved titles" />
      ) : page.items.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Save a title from its page and it shows up here."
          action={
            <Link href="/media" className={cn(buttonVariants())}>
              Browse the library
            </Link>
          }
        />
      ) : (
        <MediaBrowseGrid
          initialItems={page.items}
          initialCursor={page.nextCursor}
          source={{ kind: 'watchlist' }}
        />
      )}
    </Screen>
  );
}
