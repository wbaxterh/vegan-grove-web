import { UserPlus } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const metadata: Metadata = { title: 'Friends', robots: { index: false } };

// TODO(m2): POST /api/friends/invites, POST /api/friends/invites/:code/accept, GET /api/friends.
export default function FriendsPage() {
  return (
    <Screen
      label="Community"
      title="Friends"
      context="Friendships are mutual and private. You connect by sharing an invite code or scanning one at an event. There is no search for people, on purpose."
      action={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="invite-code" className="font-mono text-xs uppercase tracking-[0.2em]">
              Have a code?
            </label>
            <Input id="invite-code" placeholder="8 characters" disabled />
          </div>
          <Button disabled>Accept invite</Button>
          <Button variant="outline" disabled>
            Create my code
          </Button>
        </div>
      }
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Codes</p>
          <p className="text-muted-foreground">
            A code works a limited number of times and expires. Share it in person or somewhere you
            trust.
          </p>
        </>
      }
    >
      <EmptyState
        icon={UserPlus}
        title="No friends yet"
        description="Nobody can see this list. Not even a count."
      />
    </Screen>
  );
}
