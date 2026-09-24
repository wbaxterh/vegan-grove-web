import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiUnavailable } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { loadOne } from '@/lib/loaders';
import { AREA_LABELS, type Grove } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const grove = await loadOne<Grove>(`/groves/${encodeURIComponent(slug)}`);
  return grove
    ? { title: grove.name, description: grove.description.slice(0, 160) }
    : { title: 'Grove' };
}

export default async function GrovePage({ params }: Props) {
  const { slug } = await params;
  const grove = await loadOne<Grove>(`/groves/${encodeURIComponent(slug)}`);

  if (!grove) {
    return (
      <Screen label="Groves" title="Grove">
        <ApiUnavailable what="Groves" />
      </Screen>
    );
  }

  return (
    <Screen
      label="Grove"
      title={grove.name}
      context={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{AREA_LABELS[grove.area]}</Badge>
          <span className="font-mono text-xs">
            {grove.memberCount} {grove.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      }
      action={
        <Link href={`/login?next=/groves/${grove.slug}`} className={cn(buttonVariants())}>
          Log in to join
        </Link>
      }
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Events</p>
          <p className="text-muted-foreground">
            Upcoming events hosted by this grove appear on the{' '}
            <Link href="/events" className="text-vg-accent-2 hover:underline">
              events page
            </Link>
            .
          </p>
        </>
      }
    >
      <p className="max-w-3xl whitespace-pre-line leading-relaxed">{grove.description}</p>
    </Screen>
  );
}
