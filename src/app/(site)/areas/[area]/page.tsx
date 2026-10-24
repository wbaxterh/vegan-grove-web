import { MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiUnavailable, EmptyState } from '@/components/empty-state';
import { PlaceDirectory } from '@/components/places/place-directory';
import { Screen } from '@/components/screen';
import { cityPath, isArea } from '@/lib/areas';
import { citiesIn, loadPlacesForArea } from '@/lib/directory.server';
import { AREA_LABELS } from '@/lib/types';

type Props = { params: Promise<{ area: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area } = await params;
  if (!isArea(area)) notFound();
  const label = AREA_LABELS[area];
  return {
    title: `Places in ${label}`,
    description: `Approved vegan places in ${label}.`,
    alternates: { canonical: `/areas/${area}` },
  };
}

export const dynamic = 'force-dynamic';

export default async function AreaPage({ params }: Props) {
  const { area: areaParam } = await params;
  if (!isArea(areaParam)) notFound();
  const label = AREA_LABELS[areaParam];
  const { items, unavailable } = await loadPlacesForArea(areaParam);
  const cities = citiesIn(items);

  return (
    <Screen
      label="Places"
      title={label}
      context={`Approved places in ${label}. Fully vegan places come first. Chains are included and marked.`}
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Cities</p>
          {cities.length > 0 ? (
            <ul className="space-y-1">
              {cities.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={cityPath(areaParam, city.slug)}
                    className="text-vg-accent-2 hover:underline"
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Cities show up when a place names one.</p>
          )}
          <p>
            <Link href="/places" className="text-vg-accent-2 hover:underline">
              Open the map
            </Link>
          </p>
          <p>
            <Link href="/areas" className="text-vg-accent-2 hover:underline">
              All areas
            </Link>
          </p>
        </>
      }
    >
      {unavailable ? (
        <ApiUnavailable what="Places" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={`No approved places in ${label} yet`}
          description="The map is the other way to look, and new places appear after review."
        />
      ) : (
        <PlaceDirectory places={items} />
      )}
    </Screen>
  );
}
