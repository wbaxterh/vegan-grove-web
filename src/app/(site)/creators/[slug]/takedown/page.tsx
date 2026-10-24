import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CreatorGone } from '@/components/creators/creator-gone';
import { TakedownForm } from '@/components/creators/takedown-form';
import { ApiUnavailable } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { loadCreator } from '@/lib/directory.server';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadCreator(slug);
  if (loaded.status === 'missing') notFound();
  if (loaded.status === 'gone') return { title: 'Gone', robots: { index: false, follow: false } };
  return {
    title: loaded.status === 'ok' ? `Is this you? · ${loaded.item.name}` : 'Is this you?',
    robots: { index: false, follow: false },
  };
}

export const dynamic = 'force-dynamic';

export default async function CreatorTakedownPage({ params }: Props) {
  const { slug } = await params;
  const loaded = await loadCreator(slug);
  if (loaded.status === 'missing') notFound();
  if (loaded.status === 'gone') return <CreatorGone />;
  if (loaded.status !== 'ok') {
    return (
      <Screen label="Creators" title="Is this you?">
        <ApiUnavailable what="Creators" />
      </Screen>
    );
  }

  return (
    <Screen
      label="Creators"
      title="Is this you?"
      context={`Ask for a correction to the ${loaded.item.name} page, or ask for it to be removed. Removal is granted. There is no name field and no email field. A reply, if one is needed, happens on the link you give.`}
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">
            What happens
          </p>
          <p className="text-muted-foreground">
            An admin retires a removed entry. The address then answers that the page is gone, and
            the row is kept so it is not published again.
          </p>
        </>
      }
    >
      <TakedownForm slug={loaded.item.slug} />
    </Screen>
  );
}
