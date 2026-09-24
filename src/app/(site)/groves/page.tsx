import { Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiUnavailable, EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadList } from '@/lib/loaders';
import { AREA_LABELS, type Grove } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Groves',
  description: 'Local vegan activism chapters across Southern California.',
};

export const revalidate = 60;

export default async function GrovesPage() {
  const { items, unavailable } = await loadList<Grove>('/groves');

  return (
    <Screen
      label="Groves"
      title="Local chapters"
      context="A grove is a local crew: it hosts events, shares a feed, and gets people out the door together. Who is in a grove is private; how many is not."
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Joining</p>
          <p className="text-muted-foreground">
            Join from the app once you have an account. Your membership is visible to nobody but you
            and the grove's organizers.
          </p>
        </>
      }
    >
      {unavailable ? (
        <ApiUnavailable what="Groves" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groves yet"
          description="The first chapters are being planted. Check back soon."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((grove) => (
            <li key={grove.id}>
              <Card className="h-full">
                <CardHeader>
                  <Badge variant="outline">{AREA_LABELS[grove.area]}</Badge>
                  <CardTitle className="text-lg">
                    <Link href={`/groves/${grove.slug}`} className="hover:underline">
                      {grove.name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">{grove.description}</CardDescription>
                </CardHeader>
                <CardContent className="font-mono text-xs text-muted-foreground">
                  {grove.memberCount} {grove.memberCount === 1 ? 'member' : 'members'}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
