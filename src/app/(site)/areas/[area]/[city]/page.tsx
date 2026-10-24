import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiUnavailable } from '@/components/empty-state';
import { PlaceDirectory } from '@/components/places/place-directory';
import { Screen } from '@/components/screen';
import { areaPath, isArea, isCitySlug, slugifyCity } from '@/lib/areas';
import { loadPlacesForArea } from '@/lib/directory.server';
import { AREA_LABELS } from '@/lib/types';

type Props = { params: Promise<{ area: string; city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area, city } = await params;
  if (!isArea(area) || !isCitySlug(city)) notFound();
  const loaded = await loadPlacesForArea(area);
  const match = loaded.items.find((place) => slugifyCity(place.city ?? '') === city);
  if (!loaded.unavailable && !match) notFound();
  const name = match?.city ?? city;
  return {
    title: `Places in ${name}`,
    description: `Approved vegan places in ${name}, ${AREA_LABELS[area]}.`,
    alternates: { canonical: `/areas/${area}/${city}` },
  };
}

export const dynamic = 'force-dynamic';

export default async function CityPage({ params }: Props) {
  const { area, city } = await params;
  if (!isArea(area) || !isCitySlug(city)) notFound();
  const { items, unavailable } = await loadPlacesForArea(area);
  const places = items.filter((place) => slugifyCity(place.city ?? '') === city);
  if (!unavailable && places.length === 0) notFound();
  const name = places[0]?.city ?? city;
  const label = AREA_LABELS[area];

  return (
    <Screen
      label={label}
      title={name}
      context={`Approved places in ${name}. Fully vegan places come first.`}
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Area</p>
          <p>
            <Link href={areaPath(area)} className="text-vg-accent-2 hover:underline">
              {label}
            </Link>
          </p>
          <p>
            <Link href="/places" className="text-vg-accent-2 hover:underline">
              Open the map
            </Link>
          </p>
        </>
      }
    >
      {unavailable ? <ApiUnavailable what="Places" /> : <PlaceDirectory places={places} />}
    </Screen>
  );
}
