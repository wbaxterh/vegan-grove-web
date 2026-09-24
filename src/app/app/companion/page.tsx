import { Bot } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Companion', robots: { index: false } };

// TODO(m2): POST /api/companion/chat as an SSE stream, pin and delete conversations.
export default function CompanionPage() {
  const name = SITE.companionName;
  return (
    <Screen
      label="Learn"
      title={name}
      context={`${name} answers questions about places, events, and going vegan, drafts outreach messages, and helps plan a first sanctuary visit. A companion, not a mascot.`}
      action={
        <form className="flex gap-2" aria-label={`Message ${name}`}>
          <Input placeholder={`Ask ${name} something`} disabled />
          <Button type="button" disabled>
            Send
          </Button>
        </form>
      }
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">
            What {name} knows
          </p>
          <p className="text-muted-foreground">
            Your handle and the interests you chose. Never your email, area, friends, or messages.
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Memory</p>
          <p className="text-muted-foreground">
            Conversations vanish after 24 hours unless you pin them.
          </p>
        </>
      }
    >
      <EmptyState
        icon={Bot}
        title="No pinned conversations"
        description={`${name} is not wired up in this build yet.`}
      />
    </Screen>
  );
}
