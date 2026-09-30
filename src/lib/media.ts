const MEDIA_CDN_ORIGIN = process.env.NEXT_PUBLIC_MEDIA_CDN_ORIGIN?.replace(/\/+$/, '') ?? null;

/** Resolves an S3 object key to a CDN URL, or `null` when no CDN is configured. */
export function mediaUrl(key: string | undefined | null): string | null {
  if (!key || !MEDIA_CDN_ORIGIN) return null;
  return `${MEDIA_CDN_ORIGIN}/${key.replace(/^\/+/, '')}`;
}

/**
 * An image URL the page can actually show: same-origin, or on the configured media CDN.
 * Anything else is dropped so `next/image` never throws on an unlisted host and the CSP
 * (`img-src 'self' <cdn>`) never blocks a tile at paint time; the generated poster shows instead.
 */
export function usableImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  if (MEDIA_CDN_ORIGIN && url.startsWith(`${MEDIA_CDN_ORIGIN}/`)) return url;
  return null;
}
