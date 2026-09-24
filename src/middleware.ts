import { type NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

/**
 * Cheap gate for the authenticated area: no session cookie, no `/app`. The cookie is only
 * checked for presence here; `src/app/app/layout.tsx` validates it against the API and
 * bounces expired sessions the same way.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();

  const login = new URL('/login', request.url);
  login.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/app/:path*'],
};
