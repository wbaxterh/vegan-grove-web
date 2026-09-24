import { CalendarDays } from 'lucide-react';
import type { Metadata } from 'next';
import { ApiUnavailable, EmptyState } from '@/components/empty-state';
import { EventCard } from '@/components/events/event-card';
import { Screen } from '@/components/screen';
import { type LoadedList, loadList } from '@/lib/loaders';
import type { GroveEvent } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Protests, vigils, outreach, potlucks, sanctuary days, and screenings near you.',
};

export const revalidate = 60;

function EventList({ items, unavailable }: LoadedList<GroveEvent>) {
  if (unavailable) return <ApiUnavailable what="Events" />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No public events yet"
        description="When a grove or organization publishes one, it shows up here."
      />
    );
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {items.map((event) => (
        <li key={event.id}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  );
}

export default async function EventsPage() {
  const loaded = await loadList<GroveEvent>('/events');

  return (
    <Screen
      label="Events"
      title="What is happening"
      context="Public events across Southern California. RSVPs are private: organizers see who is coming, everyone else sees a count."
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Hosting</p>
          <p className="text-muted-foreground">
            Grove organizers and verified organizations can publish events from the app.
          </p>
          <p className="text-muted-foreground">
            Some events reveal the exact address only after you RSVP. That is the organizer's call,
            and it protects vigils and outreach from disruption.
          </p>
        </>
      }
    >
      <EventList {...loaded} />
    </Screen>
  );
}
