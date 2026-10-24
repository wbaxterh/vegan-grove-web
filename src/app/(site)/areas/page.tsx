import { MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Screen } from '@/components/screen';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AREA_ORDER, areaPath } from '@/lib/areas';
import { AREA_LABELS } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Areas',
  description:
    'Approved vegan places by region across Southern California, and by city inside each region.',
  alternates: { canonical: '/areas' },
};

export const revalidate = 60;

export default function AreasPage() {
  return (
    <Screen
      label="Places"
      title="Browse by area"
      context="The same regions the map uses, from the Westside to San Diego. Each page lists approved places. Open a city when you want one town."
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">The map</p>
          <p className="text-muted-foreground">
            These pages are lists. The{' '}
            <Link href="/places" className="text-vg-accent-2 hover:underline">
              map
            </Link>{' '}
            is still where you search by what is on screen. Your location is not part of either
            request.
          </p>
        </>
      }
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {AREA_ORDER.map((area) => (
          <li key={area}>
            <Card className="h-full">
              <CardHeader>
                <MapPin className="size-5 text-vg-primary" aria-hidden="true" />
                <CardTitle className="text-lg">
                  <Link href={areaPath(area)} className="hover:underline">
                    {AREA_LABELS[area]}
                  </Link>
                </CardTitle>
                <CardDescription>Approved places in {AREA_LABELS[area]}.</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
