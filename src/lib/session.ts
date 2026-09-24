/**
 * Session cookie contract shared by the session route handler and the middleware.
 * This file must stay free of `next/headers` imports so the edge middleware can use it.
 */
export const SESSION_COOKIE = 'vg_session';

/** 30 days, matching the API's sliding session expiry. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * `SESSION_COOKIE_SECURE` overrides the default so the cookie can be tested over plain
 * http locally. Unset means "secure in production, not in development".
 */
export function sessionCookieSecure(): boolean {
  const explicit = process.env.SESSION_COOKIE_SECURE;
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: sessionCookieSecure(),
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
