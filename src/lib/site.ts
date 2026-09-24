/**
 * Site-wide constants. Origins come from env so the same build can point at
 * staging or production; everything else is fixed by the spec.
 */
export const SITE = {
  name: 'Vegan Grove',
  tagline: 'A privacy-first vegan community and activism platform for Southern California.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vegangrove.org',
  docsUrl: 'https://docs.vegangrove.org',
  sourceUrl: 'https://github.com/wbaxterh/vegan-grove-web',
  companionName: 'Ivy',
} as const;

/** Public routes that belong in the sitemap. Auth and app routes are excluded on purpose. */
export const PUBLIC_ROUTES = [
  '/',
  '/places',
  '/events',
  '/groves',
  '/media',
  '/guides',
  '/privacy',
  '/terms',
] as const;
