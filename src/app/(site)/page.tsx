import {
  ArrowRight,
  CalendarDays,
  EyeOff,
  Lock,
  MapPin,
  ShieldCheck,
  Smartphone,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLabel } from '@/components/section-label';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SITE } from '@/lib/site';
import { cn } from '@/lib/utils';

const PILLARS = [
  {
    href: '/places',
    icon: MapPin,
    title: 'Places',
    description:
      'Sanctuaries, restaurants, cafes, groceries, and shops across Southern California. Seeded from OpenStreetMap and curated by members.',
    cta: 'Open the map',
  },
  {
    href: '/events',
    icon: CalendarDays,
    title: 'Events',
    description:
      'Protests, vigils, outreach, potlucks, sanctuary days, and screenings. RSVP privately; only the organizer sees who is coming.',
    cta: 'See what is on',
  },
  {
    href: '/groves',
    icon: Users,
    title: 'Groves',
    description:
      'Local chapters from Long Beach to San Diego. Membership is private, member counts are public, and every grove hosts real-world actions.',
    cta: 'Find your grove',
  },
] as const;

const PROMISES = [
  {
    icon: EyeOff,
    title: 'Profiles are never public',
    body: 'No profile pages, no follower counts, no search for people.',
  },
  {
    icon: Lock,
    title: 'Collect the minimum',
    body: 'An email for login, a handle, and a home area from a list. Nothing else.',
  },
  {
    icon: MapPin,
    title: 'No GPS on the server',
    body: 'The map centers in your browser. Queries send a bounding box, never you.',
  },
  {
    icon: ShieldCheck,
    title: 'No third-party analytics',
    body: 'No trackers, no pixels, no fonts from a CDN. Aggregate counts only.',
  },
] as const;

const LOOP = ['Learn', 'Plan', 'Act', 'Share', 'Improve'] as const;

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="vg-hero-texture pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-24 lg:px-8">
          <SectionLabel>Southern California, privacy first</SectionLabel>
          <h1 className="mt-4 font-heading text-5xl font-bold tracking-tight sm:text-7xl dark:vg-glow">
            {SITE.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            A vegan community and activism platform. Find sanctuaries, vegan places, events, and
            your people, then get out the door and act. Built so nobody can find your people but
            you.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/places" className={cn(buttonVariants({ size: 'lg' }))}>
              Find places
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
            <Link
              href="/privacy"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              Read the privacy promise
            </Link>
          </div>
          <ol className="mt-14 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {LOOP.map((step, index) => (
              <li key={step} className="flex items-center gap-2">
                <span className="rounded border border-border bg-card px-2 py-1 text-foreground">
                  {step}
                </span>
                {index < LOOP.length - 1 ? <span aria-hidden="true">&gt;</span> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionLabel>Plan</SectionLabel>
        <h2 className="mt-3 font-heading text-2xl font-semibold sm:text-3xl">
          Three ways to find your next action
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <Card key={pillar.href} className="border-border">
              <CardHeader>
                <pillar.icon className="mb-2 size-6 text-vg-primary" aria-hidden="true" />
                <CardTitle className="text-lg">{pillar.title}</CardTitle>
                <CardDescription className="leading-relaxed">{pillar.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href={pillar.href}
                  className="inline-flex items-center gap-1 text-sm font-medium text-vg-accent-2 hover:underline"
                >
                  {pillar.cta}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionLabel>The floor, not a feature</SectionLabel>
          <h2 className="mt-3 font-heading text-2xl font-semibold sm:text-3xl">Privacy promise</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map((promise) => (
              <li key={promise.title} className="flex gap-3">
                <promise.icon
                  className="mt-0.5 size-5 shrink-0 text-vg-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">{promise.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{promise.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted-foreground">
            The code and the data inventory are public.{' '}
            <a href={SITE.docsUrl} className="text-vg-accent-2 hover:underline" rel="noreferrer">
              Read the docs
            </a>{' '}
            or{' '}
            <Link href="/privacy" className="text-vg-accent-2 hover:underline">
              the full promise
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionLabel>Act</SectionLabel>
        <h2 className="mt-3 font-heading text-2xl font-semibold sm:text-3xl">Take it with you</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          The mobile app is in progress. Store links land here when the first build clears review.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {['App Store', 'Google Play'].map((store) => (
            <div
              key={store}
              aria-disabled="true"
              className="flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground"
            >
              <Smartphone className="size-5" aria-hidden="true" />
              <span>
                {store}
                <span className="ml-2 font-mono text-xs uppercase tracking-wider">coming soon</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
