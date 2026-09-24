import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiUnavailable } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { paragraphs } from '@/lib/format';
import { loadOne } from '@/lib/loaders';
import { GUIDE_CATEGORY_LABELS, type Guide } from '@/lib/types';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await loadOne<Guide>(`/guides/${encodeURIComponent(slug)}`);
  return guide ? { title: guide.title } : { title: 'Guide' };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await loadOne<Guide>(`/guides/${encodeURIComponent(slug)}`);

  if (!guide) {
    return (
      <Screen label="Guides" title="Guide">
        <ApiUnavailable what="Guides" />
      </Screen>
    );
  }

  return (
    <Screen
      label={GUIDE_CATEGORY_LABELS[guide.category]}
      title={guide.title}
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">More</p>
          <p className="text-muted-foreground">
            <Link href="/guides" className="text-vg-accent-2 hover:underline">
              All guides
            </Link>
          </p>
        </>
      }
    >
      {/* TODO(m2): render markdown through a sanitizing renderer; plain paragraphs until then. */}
      <article className="max-w-3xl space-y-4 leading-relaxed">
        {paragraphs(guide.body).map((paragraph) => (
          <p key={paragraph.id} className="whitespace-pre-line">
            {paragraph.text}
          </p>
        ))}
      </article>
    </Screen>
  );
}
