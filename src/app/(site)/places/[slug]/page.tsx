import { ExternalLink, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiUnavailable } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { PLACE_TYPE_LABELS, VEGAN_LEVEL_LABELS } from '@/lib/labels';
import { loadOne } from '@/lib/loaders';
import { AREA_LABELS, type Place } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = await loadOne<Place>(`/places/${encodeURIComponent(slug)}`);
  return place
    ? { title: place.name, description: place.description.slice(0, 160) }
    : { title: 'Place' };
}

export default async function PlacePage({ params }: Props) {
  const { slug } = await params;
  const place = await loadOne<Place>(`/places/${encodeURIComponent(slug)}`);

  if (!place) {
    return (
      <Screen label="Places" title="Place">
        <ApiUnavailable what="Places" />
      </Screen>
    );
  }

  return (
    <Screen
      label={PLACE_TYPE_LABELS[place.type]}
      title={place.name}
      context={
        <div className="flex flex-wrap gap-2">
          <Badge>{VEGAN_LEVEL_LABELS[place.veganLevel]}</Badge>
          <Badge variant="outline">{PLACE_TYPE_LABELS[place.type]}</Badge>
          <Badge variant="outline">{AREA_LABELS[place.area]}</Badge>
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
          <Link href="/login?next=/app/feed" className={cn(buttonVariants())}>
            Log in to review
          </Link>
        </div>
      }
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Details</p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>
              {place.address}
              <br />
              {place.city}
            </span>
          </p>
          {place.hours ? <p className="text-muted-foreground">{place.hours}</p> : null}
          <p className="text-muted-foreground">
            {place.reviewCount === 0
              ? 'No reviews yet.'
              : `${place.ratingAvg.toFixed(1)} from ${place.reviewCount} ${place.reviewCount === 1 ? 'review' : 'reviews'}.`}
          </p>
        </>
      }
    >
      <p className="max-w-3xl leading-relaxed">{place.description}</p>
      {place.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {place.tags.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary" className="font-mono">
                {tag}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </Screen>
  );
}
