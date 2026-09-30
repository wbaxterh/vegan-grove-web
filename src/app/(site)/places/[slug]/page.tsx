import { Clock, ExternalLink, MapPin, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiUnavailable } from '@/components/empty-state';
import { PlaceMiniMapIsland } from '@/components/places/place-mini-map-island';
import { PlaceTypeIcon } from '@/components/places/place-type-icon';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { hoursLines, telHref } from '@/lib/format';
import {
  PLACE_TYPE_BLURBS,
  PLACE_TYPE_LABELS,
  showsVeganLevel,
  VEGAN_LEVEL_LABELS,
} from '@/lib/labels';
import { loadOne } from '@/lib/loaders';
import { AREA_LABELS, type Place } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = await loadOne<Place>(`/places/${encodeURIComponent(slug)}`, 'place');
  return place
    ? { title: place.name, description: place.description.slice(0, 160) }
    : { title: 'Place' };
}

export default async function PlacePage({ params }: Props) {
  const { slug } = await params;
  const place = await loadOne<Place>(`/places/${encodeURIComponent(slug)}`, 'place');

  if (!place) {
    return (
      <Screen label="Places" title="Place">
        <ApiUnavailable what="Places" />
      </Screen>
    );
  }
  // `osm` is a provenance marker, not a topic; provenance is shown as attribution below.
  const topicTags = place.tags.filter((tag) => tag !== 'osm');
  const hours = hoursLines(place.hours);
  const blurb = PLACE_TYPE_BLURBS[place.type];
  const cityLine = [place.city, place.postcode].filter(Boolean).join(' ');

  return (
    <Screen
      label={PLACE_TYPE_LABELS[place.type]}
      title={place.name}
      context={
        <div className="flex flex-wrap gap-2">
          {showsVeganLevel(place.type) ? (
            <Badge>{VEGAN_LEVEL_LABELS[place.veganLevel]}</Badge>
          ) : null}
          <Badge variant="outline">
            <PlaceTypeIcon type={place.type} />
            {PLACE_TYPE_LABELS[place.type]}
          </Badge>
          {place.area !== 'other' ? (
            <Badge variant="outline">{AREA_LABELS[place.area]}</Badge>
          ) : null}
          {place.chain ? <Badge variant="outline">Chain</Badge> : null}
        </div>
      }
      action={
        <div className="flex flex-wrap gap-3">
          {place.website ? (
            <a
              href={place.website}
              rel="noreferrer"
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              Website
              <ExternalLink data-icon="inline-end" aria-hidden="true" />
            </a>
          ) : null}
          {place.phone ? (
            <a href={telHref(place.phone)} className={cn(buttonVariants({ variant: 'outline' }))}>
              <Phone data-icon="inline-start" aria-hidden="true" />
              Call
            </a>
          ) : null}
          <Link href="/login?next=/app/feed" className={cn(buttonVariants())}>
            Log in to review
          </Link>
        </div>
      }
      support={
        <>
          <PlaceMiniMapIsland
            name={place.name}
            lng={place.location.lng}
            lat={place.location.lat}
            type={place.type}
            veganLevel={place.veganLevel}
          />
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Details</p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>
              {place.address}
              <br />
              {cityLine}
            </span>
          </p>
          {place.phone ? (
            <p className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <a href={telHref(place.phone)} className="hover:underline">
                {place.phone}
              </a>
            </p>
          ) : null}
          {hours.length > 0 ? (
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <ul className="space-y-0.5 font-mono text-xs text-muted-foreground">
                {hours.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-muted-foreground">
            {place.reviewCount === 0
              ? 'No reviews yet.'
              : `${place.ratingAvg.toFixed(1)} from ${place.reviewCount} ${place.reviewCount === 1 ? 'review' : 'reviews'}.`}
          </p>
        </>
      }
    >
      <p className="max-w-3xl leading-relaxed">{place.description}</p>
      {blurb ? (
        <p className="max-w-3xl rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
          {blurb}
        </p>
      ) : null}
      {topicTags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {topicTags.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary" className="font-mono">
                {tag}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
      {place.source === 'osm' ? (
        <p className="text-muted-foreground text-xs">
          Data from{' '}
          <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" className="underline">
            OpenStreetMap contributors
          </a>
          , ODbL. Corrections are welcome through the app.
        </p>
      ) : null}
    </Screen>
  );
}
