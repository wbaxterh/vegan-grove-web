import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import { ApiUnavailable } from '@/components/empty-state';
import { TrailerEmbed } from '@/components/media/trailer-embed';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { MEDIA_KIND_LABELS } from '@/lib/labels';
import { loadOne } from '@/lib/loaders';
import type { MediaItem } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadOne<MediaItem>(`/media/${encodeURIComponent(slug)}`);
  return item
    ? { title: item.title, description: item.synopsis.slice(0, 160) }
    : { title: 'Media' };
}

export default async function MediaItemPage({ params }: Props) {
  const { slug } = await params;
  const item = await loadOne<MediaItem>(`/media/${encodeURIComponent(slug)}`);

  if (!item) {
    return (
      <Screen label="Media" title="Media">
        <ApiUnavailable what="Media items" />
      </Screen>
    );
  }

  return (
    <Screen
      label={`${MEDIA_KIND_LABELS[item.kind]} / ${item.year}`}
      title={item.title}
      context={<p>{item.synopsis}</p>}
      action={
        item.watchLinks.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {item.watchLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                rel="noreferrer"
                className={cn(buttonVariants({ variant: 'outline' }))}
              >
                Watch on {link.provider}
                <ExternalLink data-icon="inline-end" aria-hidden="true" />
              </a>
            ))}
          </div>
        ) : null
      }
      support={
        item.tags.length > 0 ? (
          <>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Tags</p>
            <ul className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <li key={tag}>
                  <Badge variant="secondary" className="font-mono">
                    {tag}
                  </Badge>
                </li>
              ))}
            </ul>
          </>
        ) : null
      }
    >
      {item.trailerYoutubeId ? (
        <TrailerEmbed youtubeId={item.trailerYoutubeId} title={item.title} />
      ) : null}
    </Screen>
  );
}
