import { MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Messages', robots: { index: false } };

// TODO(m2): GET /api/conversations, the /messages Socket.IO namespace, and per-conversation views.
export default function MessagesPage() {
  return (
    <Screen
      label="Community"
      title="Messages"
      context="Direct messages with your friends. Encrypted at rest, gone after 90 days."
      action={
        <Button size="sm" disabled>
          New conversation
        </Button>
      }
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Retention</p>
          <p className="text-muted-foreground">
            Messages expire 90 days after they are sent. End-to-end encryption is a documented open
            decision, not a promise yet.
          </p>
        </>
      }
    >
      <EmptyState
        icon={MessageSquare}
        title="No conversations"
        description="You can only message friends. Add one from the Friends screen first."
      />
    </Screen>
  );
}
