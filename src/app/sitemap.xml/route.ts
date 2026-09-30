import { loadAllMedia, loadCollections } from '@/lib/media-library.server';
import { PUBLIC_ROUTES, SITE } from '@/lib/site';

export const dynamic = 'force-static';
/** Rebuilt hourly so a newly published title or collection joins without a deploy. */
export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function url(path: string): string {
  return `  <url><loc>${escapeXml(`${SITE.url}${path === '/' ? '' : path}`)}</loc></url>`;
}

/**
 * Static routes plus every published media item and collection. Places, events, and the
 * rest join once the API exposes a slug feed for them. An unreachable API yields the static
 * routes alone rather than a failed build.
 */
export async function GET() {
  const [media, collections] = await Promise.all([loadAllMedia(), loadCollections()]);

  const urls = [
    ...PUBLIC_ROUTES.map(url),
    ...collections.map((collection) => url(`/media/collections/${collection.slug}`)),
    ...media.map((item) => url(`/media/${item.slug}`)),
  ].join('\n');

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
