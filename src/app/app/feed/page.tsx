import { Rss } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Feed', robots: { index: false } };

/*
 * There is no public profile route anywhere in this app, and none is planned. Privacy rule 1
 * permits a `/handles/[handle]` view showing only a handle, its avatar, and its public posts
 * (no bio, area, friends, or counts). It is deliberately not built in the scaffold; when it is,
 * it must read `GET /api/handles/:handle/posts` and nothing else.
 */

// TODO(m2): wire GET /api/feed?scope=friends|grove:<id>|public with cursor pagination.
export default function FeedPage() {
  return (
    <Screen
      label="Share"
      title="Feed"
      context="Posts from your friends and your groves. Photos only, metadata stripped, love reactions and nothing to dunk with."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" disabled>
            Friends
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Grove
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Public
          </Button>
          <Button size="sm" className="ml-auto" disabled>
            New post
          </Button>
        </div>
      }
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Visibility</p>
          <p className="text-muted-foreground">
            Posts default to friends. Public posting stays off until you turn it on in{' '}
            <Link href="/app/settings" className="text-vg-accent-2 hover:underline">
              settings
            </Link>
            , and then it is a choice per post.
          </p>
        </>
      }
    >
      <EmptyState
        icon={Rss}
        title="Nothing here yet"
        description="Add a friend by invite code or join a grove and their posts show up here."
      />
    </Screen>
  );
}
