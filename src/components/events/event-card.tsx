import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateRange } from '@/lib/format';
import { EVENT_TYPE_LABELS } from '@/lib/labels';
import type { GroveEvent } from '@/lib/types';

/** When, where (as much as the organizer allows), and who is hosting, in that order. */
export function EventCard({ event }: { event: GroveEvent }) {
  const going = `${event.rsvpCount} ${event.rsvpCount === 1 ? 'person' : 'people'} going`;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{EVENT_TYPE_LABELS[event.type]}</Badge>
          {event.status === 'cancelled' ? <Badge variant="destructive">Cancelled</Badge> : null}
        </div>
        <CardTitle className="text-lg">
          <Link href={`/events/${event.slug}`} className="hover:underline">
            {event.title}
          </Link>
        </CardTitle>
        <CardDescription>{formatDateRange(event.startsAt, event.endsAt)}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>{event.detailsAfterRsvp ? 'Location shared after RSVP' : event.venueName}</p>
        {event.hostName ? <p>Hosted by {event.hostName}</p> : null}
        <p className="mt-2 font-mono text-xs">{going}</p>
      </CardContent>
    </Card>
  );
}
