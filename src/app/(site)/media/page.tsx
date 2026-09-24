import { Film } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiUnavailable, EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MEDIA_KIND_LABELS } from '@/lib/labels';
import { loadList } from '@/lib/loaders';
import type { MediaItem } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Media',
  description: 'Documentaries, films, talks, and shorts worth watching and sharing.',
};

export const revalidate = 60;

export default async function MediaPage() {
  const { items, unavailable } = await loadList<MediaItem>('/media');

  return (
    <Screen
      label="Learn"
      title="Media library"
      context="Documentaries, films, series, and talks that turn curiosity into action. Trailers load only when you click them."
    >
      {unavailable ? (
        <ApiUnavailable what="Media items" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Film}
          title="The library is empty"
          description="Titles are curated by hand. The first batch is on its way."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{MEDIA_KIND_LABELS[item.kind]}</Badge>
                    <Badge variant="secondary" className="font-mono">
                      {item.year}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    <Link href={`/media/${item.slug}`} className="hover:underline">
                      {item.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">{item.synopsis}</CardDescription>
                </CardHeader>
                {item.tags.length > 0 ? (
                  <CardContent className="font-mono text-xs text-muted-foreground">
                    {item.tags.join(' / ')}
                  </CardContent>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
