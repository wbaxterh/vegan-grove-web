import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiUnavailable } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { formatDateRange } from '@/lib/format';
import { EVENT_TYPE_LABELS } from '@/lib/labels';
import { loadOne } from '@/lib/loaders';
import type { GroveEvent } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadOne<GroveEvent>(`/events/${encodeURIComponent(slug)}`);
  return event
    ? { title: event.title, description: event.description.slice(0, 160) }
    : { title: 'Event' };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await loadOne<GroveEvent>(`/events/${encodeURIComponent(slug)}`);

  if (!event) {
    return (
      <Screen label="Events" title="Event">
        <ApiUnavailable what="Events" />
      </Screen>
    );
  }

  const hostHref =
    event.hostSlug && event.hostType === 'grove' ? `/groves/${event.hostSlug}` : null;

  return (
    <Screen
      label={EVENT_TYPE_LABELS[event.type]}
      title={event.title}
      context={
        <div className="space-y-2">
          <p className="font-medium text-foreground">
            {formatDateRange(event.startsAt, event.endsAt)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{EVENT_TYPE_LABELS[event.type]}</Badge>
            {event.status === 'cancelled' ? <Badge variant="destructive">Cancelled</Badge> : null}
          </div>
        </div>
      }
      action={
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/login?next=/events/${event.slug}`} className={cn(buttonVariants())}>
            Log in to RSVP
          </Link>
          <span className="font-mono text-xs text-muted-foreground">
            {event.rsvpCount} {event.rsvpCount === 1 ? 'person' : 'people'} going
          </span>
        </div>
      }
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Where</p>
          <p>
            {event.venueName}
            {event.address ? (
              <>
                <br />
                <span className="text-muted-foreground">{event.address}</span>
              </>
            ) : null}
          </p>
          {event.detailsAfterRsvp && !event.address ? (
            <p className="text-muted-foreground">The exact address is shared after you RSVP.</p>
          ) : null}
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Host</p>
          <p>
            {hostHref ? (
              <Link href={hostHref} className="text-vg-accent-2 hover:underline">
                {event.hostName ?? 'A grove'}
              </Link>
            ) : (
              (event.hostName ?? 'An organization')
            )}
          </p>
        </>
      }
    >
      <p className="max-w-3xl whitespace-pre-line leading-relaxed">{event.description}</p>
    </Screen>
  );
}
