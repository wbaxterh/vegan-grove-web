import { PUBLIC_ROUTES, SITE } from '@/lib/site';

export const dynamic = 'force-static';

/** Static routes only. Places, events, and the rest join once the API exposes a slug feed. */
export function GET() {
  const urls = PUBLIC_ROUTES.map(
    (path) => `  <url><loc>${SITE.url}${path === '/' ? '' : path}</loc></url>`,
  ).join('\n');

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
