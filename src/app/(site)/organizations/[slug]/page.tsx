import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiUnavailable } from '@/components/empty-state';
import { OutboundAnchor } from '@/components/outbound-anchor';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { areaPath } from '@/lib/areas';
import { loadOrganization } from '@/lib/directory.server';
import { ORGANIZATION_TYPE_LABELS } from '@/lib/labels';
import { outboundLinks } from '@/lib/social-links';
import { AREA_LABELS } from '@/lib/types';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadOrganization(slug);
  if (loaded.status === 'missing') notFound();
  if (loaded.status !== 'ok') return { title: 'Organization' };
  return {
    title: loaded.item.name,
    description: loaded.item.description.slice(0, 160),
    alternates: { canonical: `/organizations/${loaded.item.slug}` },
  };
}

export const dynamic = 'force-dynamic';

export default async function OrganizationPage({ params }: Props) {
  const { slug } = await params;
  const loaded = await loadOrganization(slug);
  if (loaded.status === 'missing') notFound();
  if (loaded.status !== 'ok') {
    return (
      <Screen label="Organizations" title="Organization">
        <ApiUnavailable what="Organizations" />
      </Screen>
    );
  }

  const organization = loaded.item;
  const links = outboundLinks(organization);

  return (
    <Screen
      label={ORGANIZATION_TYPE_LABELS[organization.type]}
      title={organization.name}
      context={
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{ORGANIZATION_TYPE_LABELS[organization.type]}</Badge>
          {organization.area ? (
            <Link href={areaPath(organization.area)}>
              <Badge variant="outline">{AREA_LABELS[organization.area]}</Badge>
            </Link>
          ) : null}
          {organization.verified ? <Badge>Verified</Badge> : null}
        </div>
      }
      action={
        links.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {links.map((link) => (
              <OutboundAnchor key={link.href} href={link.href}>
                {link.label}
              </OutboundAnchor>
            ))}
          </div>
        ) : null
      }
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Events</p>
          <p className="text-muted-foreground">
            Public events this organization hosts appear on the{' '}
            <Link href="/events" className="text-vg-accent-2 hover:underline">
              events page
            </Link>
            .
          </p>
          <p>
            <Link href="/organizations" className="text-vg-accent-2 hover:underline">
              All organizations
            </Link>
          </p>
        </>
      }
    >
      <p className="max-w-3xl whitespace-pre-line leading-relaxed">{organization.description}</p>
    </Screen>
  );
}
