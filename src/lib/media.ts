const MEDIA_CDN_ORIGIN = process.env.NEXT_PUBLIC_MEDIA_CDN_ORIGIN?.replace(/\/+$/, '') ?? null;

/** Resolves an S3 object key to a CDN URL, or `null` when no CDN is configured. */
export function mediaUrl(key: string | undefined | null): string | null {
  if (!key || !MEDIA_CDN_ORIGIN) return null;
  return `${MEDIA_CDN_ORIGIN}/${key.replace(/^\/+/, '')}`;
}
