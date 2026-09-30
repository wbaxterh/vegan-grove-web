import { MEDIA_KIND_LABELS } from '@/lib/labels';
import { loadAllMedia, loadCollections } from '@/lib/media-library.server';
import { SITE } from '@/lib/site';
import type { MediaItem } from '@/lib/types';

export const dynamic = 'force-static';
/** Rebuilt hourly alongside the sitemap. */
export const revalidate = 3600;

function mediaLine(item: MediaItem): string {
  const kind = MEDIA_KIND_LABELS[item.kind];
  const year = item.year ? `, ${item.year}` : '';
  const free = item.watchLinks.some((link) => link.access === 'free') ? ', free to watch' : '';
  return `- [${item.title}](${SITE.url}/media/${item.slug}): ${kind}${year}${free}`;
}

export async function GET() {
  const [media, collections] = await Promise.all([loadAllMedia(), loadCollections()]);

  const body = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.tagline}`,
    '',
    'Vegan Grove helps activists find sanctuaries, vegan places, events, and local chapters',
    '(Groves) in Southern California, then get out the door and act. Member profiles are never',
    'public, the app collects the minimum, and there is no third-party analytics.',
    '',
    '## Docs',
    '',
    `- Product, privacy, and architecture documentation: ${SITE.docsUrl}`,
    `- Source: ${SITE.sourceUrl}`,
    '',
    '## Public pages',
    '',
    `- ${SITE.url}/places`,
    `- ${SITE.url}/events`,
    `- ${SITE.url}/groves`,
    `- ${SITE.url}/media`,
    `- ${SITE.url}/guides`,
    `- ${SITE.url}/privacy`,
    '',
    '## Media library',
    '',
    'A catalog of documentaries, films, series, talks, and shorts about animals, health, and',
    'the planet. Vegan Grove hosts nothing: each page lists where the title can be watched, its',
    'credits, content warnings, and the actions its makers ask for.',
    '',
    ...(media.length > 0 ? media.map(mediaLine) : ['- (no titles published yet)']),
    '',
    '## Collections',
    '',
    ...(collections.length > 0
      ? collections.map(
          (collection) =>
            `- [${collection.name}](${SITE.url}/media/collections/${collection.slug})${collection.description ? `: ${collection.description}` : ''}`,
        )
      : ['- (no collections published yet)']),
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
