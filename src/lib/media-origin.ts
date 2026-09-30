/**
 * Where posters, backdrops and uploads are served from. The CloudFront domain in front of the
 * media bucket is public by nature (it is in every image URL the API hands out), so it is the
 * built-in default; NEXT_PUBLIC_MEDIA_CDN_ORIGIN overrides it for previews, tests and the day
 * a custom domain replaces it. Shared by next.config.ts (CSP and image allow-list) and the
 * image helpers, so the two can never disagree.
 */
export const DEFAULT_MEDIA_CDN_ORIGIN = 'https://d2ae2gsixnce86.cloudfront.net';

export function resolveMediaCdnOrigin(value = process.env.NEXT_PUBLIC_MEDIA_CDN_ORIGIN): string {
  const trimmed = value?.trim().replace(/\/+$/, '');
  return trimmed ? trimmed : DEFAULT_MEDIA_CDN_ORIGIN;
}
