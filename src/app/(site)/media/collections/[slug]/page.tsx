import { Film } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiUnavailable, EmptyState } from '@/components/empty-state';
import { NoHostingNote } from '@/components/media/no-hosting-note';
import { PosterGrid } from '@/components/media/poster-grid';
import { Screen } from '@/components/screen';
import { loadCollection } from '@/lib/media-library.server';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await loadCollection(slug);
  return collection
    ? {
        title: collection.name,
        description: collection.description.slice(0, 160),
        alternates: { canonical: `/media/collections/${collection.slug}` },
      }
    : { title: 'Collection' };
}

/** An editorial shelf in full: the titles in the order the editors set them. */
export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = await loadCollection(slug);

  if (!collection) {
    return (
      <Screen label="Collection" title="Collection">
        <ApiUnavailable what="Collections" />
      </Screen>
    );
  }

  const count = collection.items.length;

  return (
    <Screen
      label="Collection"
      title={collection.name}
      context={collection.description || undefined}
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Library</p>
          <p className="text-muted-foreground">
            {count} {count === 1 ? 'title' : 'titles'}, in the order the editors set.
          </p>
          <p>
            <Link href="/media" className="text-vg-accent-2 hover:underline">
              Back to the library
            </Link>
          </p>
          <NoHostingNote />
        </>
      }
    >
      {count === 0 ? (
        <EmptyState
          icon={Film}
          title="Nothing in this collection yet"
          description="The editors are still filling it. Check back soon."
        />
      ) : (
        <PosterGrid items={collection.items} />
      )}
    </Screen>
  );
}
