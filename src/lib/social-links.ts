import type { SocialHandles } from './types';

export type SocialNetwork = keyof SocialHandles;

export type OutboundLink = { label: string; href: string };

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x: 'X',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  facebook: 'Facebook',
};

const SOCIAL_ORDER: readonly SocialNetwork[] = [
  'youtube',
  'instagram',
  'tiktok',
  'x',
  'bluesky',
  'mastodon',
  'facebook',
];

const HANDLE = /^[A-Za-z0-9._-]{1,80}$/;

const TRACKING_PARAMS = new Set(['fbclid', 'igshid', 'si', 'mc_cid', 'mc_eid']);

/**
 * An http(s) URL with the hash and common tracking parameters removed. Anything else
 * (javascript:, a handle, a data URL) is dropped so a stored value cannot become a script
 * or a hotlinked asset.
 */
export function safeOutboundUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password) return null;
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    const lower = key.toLowerCase();
    if (lower.startsWith('utm_') || TRACKING_PARAMS.has(lower)) url.searchParams.delete(key);
  }
  return url.toString();
}

function bareHandle(value: string | null | undefined): string | null {
  if (!value) return null;
  const handle = value.trim().replace(/^@/, '');
  if (!HANDLE.test(handle) || handle.includes('://')) return null;
  return handle;
}

/** Channel id (`UC…`), an `@name` path, or a short path under youtube.com. Never a full URL. */
export function youtubeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw || raw.includes('://') || raw.includes('?') || raw.includes('#') || /\s/.test(raw)) {
    return null;
  }
  const path = raw.replace(/^\/+/, '');
  if (path.startsWith('@')) {
    const name = path.slice(1);
    return HANDLE.test(name) ? `https://www.youtube.com/@${name}` : null;
  }
  if (/^UC[A-Za-z0-9_-]{20,}$/.test(path)) return `https://www.youtube.com/channel/${path}`;
  if (/^(?:c|user|channel)\/[A-Za-z0-9._-]{1,80}$/.test(path)) {
    return `https://www.youtube.com/${path}`;
  }
  return HANDLE.test(path) ? `https://www.youtube.com/@${path}` : null;
}

function profileUrl(
  value: string | null | undefined,
  build: (handle: string) => string,
): string | null {
  const handle = bareHandle(value);
  return handle ? build(handle) : null;
}

function blueskyUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  let handle = value.trim().replace(/^@/, '');
  if (!handle || handle.includes('://') || /\s/.test(handle)) return null;
  if (!handle.includes('.')) handle = `${handle}.bsky.social`;
  if (!/^[A-Za-z0-9.-]{1,120}$/.test(handle)) return null;
  return `https://bsky.app/profile/${handle}`;
}

/** `user@instance.social` becomes the instance's profile URL. A bare name is not guessable. */
function mastodonUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim().replace(/^@/, '');
  const match = raw.match(/^([A-Za-z0-9._-]{1,80})@([A-Za-z0-9.-]+\.[A-Za-z]{2,})$/);
  if (!match) return null;
  return `https://${match[2]}/@${match[1]}`;
}

function socialHref(network: SocialNetwork, value: string | null | undefined): string | null {
  switch (network) {
    case 'youtube':
      return youtubeUrl(value);
    case 'instagram':
      return profileUrl(value, (handle) => `https://www.instagram.com/${handle}/`);
    case 'tiktok':
      return profileUrl(value, (handle) => `https://www.tiktok.com/@${handle}`);
    case 'x':
      return profileUrl(value, (handle) => `https://x.com/${handle}`);
    case 'facebook':
      return profileUrl(value, (handle) => `https://www.facebook.com/${handle}`);
    case 'bluesky':
      return blueskyUrl(value);
    case 'mastodon':
      return mastodonUrl(value);
    default:
      return null;
  }
}

/** Website, podcast, then handles, in a fixed order. Empty and unsafe values are omitted. */
export function outboundLinks(input: {
  website?: string | null;
  podcast?: string | null;
  socials?: SocialHandles | null;
}): OutboundLink[] {
  const links: OutboundLink[] = [];
  const website = safeOutboundUrl(input.website);
  if (website) links.push({ label: 'Website', href: website });
  const podcast = safeOutboundUrl(input.podcast);
  if (podcast) links.push({ label: 'Podcast', href: podcast });
  const socials = input.socials ?? {};
  for (const network of SOCIAL_ORDER) {
    const href = socialHref(network, socials[network]);
    if (href) links.push({ label: SOCIAL_LABELS[network], href });
  }
  return links;
}
