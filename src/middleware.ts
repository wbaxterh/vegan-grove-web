import { type NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';
import { goneDocument } from '@/lib/gone-document';
import { SESSION_COOKIE } from '@/lib/session';

const CREATOR_PATH = /^\/creators\/([^/]+)$/;

/**
 * `/app` still requires a session cookie. A document request for `/creators/:slug` also asks
 * the API whether that entry was retired: a 410 is answered here, because an App Router page
 * cannot set that status. RSC and prefetch requests fall through so a client navigation can
 * render the same message inside the site layout.
 */
function isRsc(request: NextRequest): boolean {
  return (
    request.headers.get('rsc') === '1' ||
    request.headers.has('next-router-prefetch') ||
    request.headers.has('next-router-segment-prefetch')
  );
}

function decodeSlug(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

async function retiredCreatorResponse(slug: string): Promise<NextResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/creators/${encodeURIComponent(slug)}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    const status = response.status;
    await response.body?.cancel().catch(() => undefined);
    if (status !== 410) return null;
    return new NextResponse(goneDocument(), {
      status: 410,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
        'x-robots-tag': 'noindex',
      },
    });
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const creator = request.nextUrl.pathname.match(CREATOR_PATH);
  const slug = creator ? decodeSlug(creator[1]) : null;
  if (slug && !isRsc(request)) {
    const gone = await retiredCreatorResponse(slug);
    if (gone) return gone;
  }

  if (!request.nextUrl.pathname.startsWith('/app')) return NextResponse.next();
  if (request.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();

  const login = new URL('/login', request.url);
  login.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/app/:path*', '/creators/:slug'],
};
