import type { NextConfig } from 'next';

/**
 * Security headers are computed at build time from the public env, so a staging build and a
 * production build each allow exactly their own API and CDN origins and nothing else.
 */

const isProduction = process.env.NODE_ENV === 'production';

const OPENFREEMAP_TILES = 'https://tiles.openfreemap.org';
const YOUTUBE_NOCOOKIE = 'https://www.youtube-nocookie.com';
// Bunny Stream pull zones live under b-cdn.net. Narrow this to the exact zone hostname
// once it exists; wildcards are the widest this policy should ever get.
const BUNNY_CDN = 'https://*.b-cdn.net';

function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api');
const mediaOrigin = originOf(process.env.NEXT_PUBLIC_MEDIA_CDN_ORIGIN);

function directive(name: string, ...sources: (string | null | false)[]): string {
  return [name, ...sources.filter((source): source is string => Boolean(source))].join(' ');
}

// Next 15 streams its RSC payload through inline scripts and next-themes sets the class
// through one, so 'unsafe-inline' stays until this app moves to a nonce-per-request
// middleware (which forces dynamic rendering everywhere). 'unsafe-eval' is dev-only for HMR.
const contentSecurityPolicy = [
  directive('default-src', "'self'"),
  directive('base-uri', "'self'"),
  directive('object-src', "'none'"),
  directive('frame-ancestors', "'none'"),
  directive('form-action', "'self'"),
  directive('script-src', "'self'", "'unsafe-inline'", !isProduction && "'unsafe-eval'"),
  directive('style-src', "'self'", "'unsafe-inline'"),
  directive('img-src', "'self'", 'data:', 'blob:', mediaOrigin),
  directive('font-src', "'self'"),
  directive('connect-src', "'self'", apiOrigin, OPENFREEMAP_TILES, BUNNY_CDN),
  directive('media-src', "'self'", 'blob:', BUNNY_CDN, mediaOrigin),
  directive('worker-src', "'self'", 'blob:'),
  directive('frame-src', YOUTUBE_NOCOOKIE),
  directive('manifest-src', "'self'"),
  isProduction && 'upgrade-insecure-requests',
]
  .filter((line): line is string => Boolean(line))
  .join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()',
  },
];

function remotePatternFor(
  origin: string | null,
): NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> {
  if (!origin) return [];
  const url = new URL(origin);
  return [
    {
      protocol: url.protocol.replace(':', '') as 'http' | 'https',
      hostname: url.hostname,
      port: url.port,
      pathname: '/**',
    },
  ];
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: remotePatternFor(mediaOrigin),
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
