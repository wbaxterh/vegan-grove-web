import { Building2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiUnavailable, EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadAllOrganizations } from '@/lib/directory.server';
import { ORGANIZATION_TYPE_LABELS } from '@/lib/labels';
import { AREA_LABELS, type OrganizationType } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Organizations',
  description:
    'Chapters, sanctuaries, and vegan businesses that host actions across Southern California.',
  alternates: { canonical: '/organizations' },
};

export const dynamic = 'force-dynamic';

const TYPES: OrganizationType[] = ['org', 'sanctuary', 'business'];

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function selectedType(value: string | string[] | undefined): OrganizationType | null {
  const first = Array.isArray(value) ? value[0] : value;
  return TYPES.includes(first as OrganizationType) ? (first as OrganizationType) : null;
}

export default async function OrganizationsPage({ searchParams }: Props) {
  const type = selectedType((await searchParams).type);
  const { items, unavailable } = await loadAllOrganizations();
  const shown = type ? items.filter((organization) => organization.type === type) : items;

  return (
    <Screen
      label="Organizations"
      title="Who hosts the work"
      context="Chapters, sanctuaries, and businesses that host events and volunteer days. Verified organizations are listed first. They cannot message members from here."
      action={
        <nav aria-label="Organization type" className="flex flex-wrap gap-2">
          <TypeLink href="/organizations" current={type === null}>
            All
          </TypeLink>
          {TYPES.map((item) => (
            <TypeLink key={item} href={`/organizations?type=${item}`} current={type === item}>
              {ORGANIZATION_TYPE_LABELS[item]}
            </TypeLink>
          ))}
        </nav>
      }
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Guests</p>
          <p className="text-muted-foreground">
            Organizations are guests of the community. A verified badge means an admin checked the
            organization's own site. Membership lists are not part of this directory.
          </p>
          <p className="text-muted-foreground">
            Upcoming actions are on the{' '}
            <Link href="/events" className="text-vg-accent-2 hover:underline">
              events page
            </Link>
            .
          </p>
        </>
      }
    >
      {unavailable ? (
        <ApiUnavailable what="Organizations" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Chapters and sanctuaries show up here after they are checked."
        />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nothing in this group"
          description="Try another type, or look at the full directory."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {shown.map((organization) => (
            <li key={organization.id}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{ORGANIZATION_TYPE_LABELS[organization.type]}</Badge>
                    {organization.area ? (
                      <Badge variant="outline">{AREA_LABELS[organization.area]}</Badge>
                    ) : null}
                    {organization.verified ? <Badge>Verified</Badge> : null}
                  </div>
                  <CardTitle className="text-lg">
                    <Link href={`/organizations/${organization.slug}`} className="hover:underline">
                      {organization.name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {organization.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}

function TypeLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground aria-[current=page]:border-vg-primary aria-[current=page]:text-foreground"
    >
      {children}
    </Link>
  );
}
