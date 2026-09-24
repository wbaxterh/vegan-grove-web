import { Sprout } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppNav } from '@/components/app/app-nav';
import { SignOutButton } from '@/components/app/sign-out-button';
import { ApiUnavailable } from '@/components/empty-state';
import { ThemeToggle } from '@/components/theme-toggle';
import { getCurrentUser } from '@/lib/current-user';
import { SITE } from '@/lib/site';

/**
 * The authenticated shell. Middleware already bounced requests without a cookie; this layout
 * validates the session against the API so an expired cookie lands on /login too.
 */
export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const result = await getCurrentUser();
  if (result.status === 'expired') redirect('/login?next=/app/feed');

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Link href="/" className="flex items-center gap-2 px-2 font-mono text-sm font-semibold">
          <Sprout className="size-5 text-vg-primary" aria-hidden="true" />
          {SITE.name}
        </Link>
        <div className="mt-8">
          <AppNav />
        </div>
        <div className="mt-auto space-y-3 border-t border-sidebar-border pt-4">
          <p className="truncate px-2 font-mono text-xs text-muted-foreground">
            {result.user ? `@${result.user.handle}` : 'Session pending'}
          </p>
          <div className="flex items-center justify-between">
            <SignOutButton />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 md:hidden">
          <Link href="/" className="font-mono text-sm font-semibold">
            {SITE.name}
          </Link>
          <AppNav orientation="horizontal" />
          <SignOutButton />
        </header>
        <main className="flex-1">
          {result.status === 'ok' ? (
            children
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-16">
              <ApiUnavailable what="Your account and feed" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
