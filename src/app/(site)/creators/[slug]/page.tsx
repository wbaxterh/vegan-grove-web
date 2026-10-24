import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CreatorGone } from '@/components/creators/creator-gone';
import { ApiUnavailable } from '@/components/empty-state';
import { InitialsAvatar } from '@/components/initials-avatar';
import { OutboundAnchor } from '@/components/outbound-anchor';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { countryLabel, languageLabel } from '@/lib/creators';
import { loadCreator } from '@/lib/directory.server';
import { CREATOR_KIND_LABELS, creatorTopicLabel } from '@/lib/labels';
import { outboundLinks, safeOutboundUrl } from '@/lib/social-links';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadCreator(slug);
  if (loaded.status === 'missing') notFound();
  if (loaded.status === 'gone') return { title: 'Gone', robots: { index: false, follow: false } };
  if (loaded.status !== 'ok') return { title: 'Creator' };
  return {
    title: loaded.item.name,
    description: loaded.item.bio.slice(0, 160),
    alternates: { canonical: `/creators/${loaded.item.slug}` },
  };
}

export const dynamic = 'force-dynamic';

export default async function CreatorPage({ params }: Props) {
  const { slug } = await params;
  const loaded = await loadCreator(slug);
  if (loaded.status === 'missing') notFound();
  if (loaded.status === 'gone') return <CreatorGone />;
  if (loaded.status !== 'ok') {
    return (
      <Screen label="Creators" title="Creator">
        <ApiUnavailable what="Creators" />
      </Screen>
    );
  }

  const creator = loaded.item;
  const links = outboundLinks(creator);
  const source = creator.veganSource ? safeOutboundUrl(creator.veganSource.url) : null;
  const where = [
    countryLabel(creator.country),
    creator.languages.length > 0 ? creator.languages.map(languageLabel).join(', ') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen
      label="Creator"
      title={
        <span className="flex items-center gap-4">
          <InitialsAvatar name={creator.name} />
          <span>{creator.name}</span>
        </span>
      }
      context={
        <div className="space-y-3">
          {creator.alsoKnownAs.length > 0 ? (
            <p>Also known as {creator.alsoKnownAs.join(', ')}.</p>
          ) : null}
          <p>{creator.bio}</p>
          <div className="flex flex-wrap gap-2">
            {creator.kind !== 'person' ? (
              <Badge variant="outline">{CREATOR_KIND_LABELS[creator.kind]}</Badge>
            ) : null}
            {creator.topics.map((topic) => (
              <Link key={topic} href={`/creators?topic=${encodeURIComponent(topic)}`}>
                <Badge variant="outline">{creatorTopicLabel(topic)}</Badge>
              </Link>
            ))}
          </div>
          {where ? <p className="font-mono text-xs text-muted-foreground">{where}</p> : null}
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
        ) : (
          <p className="text-sm text-muted-foreground">No public links on this entry yet.</p>
        )
      }
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Source</p>
          {source && creator.veganSource ? (
            <p>
              <a
                href={source}
                rel="noopener noreferrer"
                className="text-vg-accent-2 hover:underline"
              >
                {creator.veganSource.label}
              </a>
            </p>
          ) : (
            <p className="text-muted-foreground">The citation for this entry is not listed.</p>
          )}
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">This entry</p>
          <p className="text-muted-foreground">
            Inclusion means the person is publicly vegan and makes useful work on one of these
            topics. It is not an endorsement of everything they say.
          </p>
          <p>
            <Link
              href={`/creators/${creator.slug}/takedown`}
              className="text-vg-accent-2 hover:underline"
            >
              Is this you?
            </Link>
          </p>
          <p>
            <Link href="/creators" className="text-vg-accent-2 hover:underline">
              All creators
            </Link>
          </p>
        </>
      }
    >
      {creator.kind !== 'person' && creator.members.length > 0 ? (
        <p className="max-w-3xl text-muted-foreground">With {creator.members.join(', ')}.</p>
      ) : null}
    </Screen>
  );
}
