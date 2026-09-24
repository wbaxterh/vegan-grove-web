import type { Metadata } from 'next';
import { SignOutButton } from '@/components/app/sign-out-button';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCurrentUser } from '@/lib/current-user';
import { AREA_LABELS } from '@/lib/types';

export const metadata: Metadata = { title: 'Settings', robots: { index: false } };

// TODO(m2): PATCH /api/me, GET/DELETE /api/me/sessions, DELETE /api/me with confirmation.
export default async function SettingsPage() {
  const { user } = await getCurrentUser();

  return (
    <Screen
      label="Account"
      title="Settings"
      context="Everything the platform knows about you fits on this screen."
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Deletion</p>
          <p className="text-muted-foreground">
            Deleting your account is immediate and complete: sessions, friendships, RSVPs, posts,
            comments, reactions, messages, action log, and companion conversations. Places and
            reviews you submitted stay, detached from you.
          </p>
        </>
      }
    >
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="handle" className="text-sm font-medium">
              Handle
            </label>
            <Input id="handle" value={user?.handle ?? ''} readOnly disabled />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Home area</p>
            <p className="flex h-8 items-center">
              <Badge variant="outline">{user ? AREA_LABELS[user.homeArea] : 'Not set'}</Badge>
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Your email is used for logging in and is never shown, not even here.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Visibility</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Public posts</p>
            <p className="text-xs text-muted-foreground">
              Off by default. Turning it on lets you choose public for individual posts.
            </p>
          </div>
          <Badge variant={user?.publicPostsEnabled ? 'default' : 'outline'} className="font-mono">
            {user?.publicPostsEnabled ? 'On' : 'Off'}
          </Badge>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Sessions</h2>
        <div className="flex flex-wrap gap-3">
          <SignOutButton />
          <Button variant="outline" size="sm" disabled>
            Sign out everywhere
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-destructive/40 bg-card p-5">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-destructive">
          Danger zone
        </h2>
        <Button variant="destructive" size="sm" disabled>
          Delete my account
        </Button>
      </section>
    </Screen>
  );
}
