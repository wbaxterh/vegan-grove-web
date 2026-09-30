import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ApiError, apiFetch } from './api';
import { SESSION_COOKIE } from './session';

/**
 * Helpers for the same-origin route handlers that act on behalf of the signed-in member
 * (save a title, react to it). The browser calls `/api/media/...` on this site with its
 * cookie; the handler forwards the call to the API as a bearer token. The token never
 * reaches browser JavaScript, and the principal is always the session, never the body.
 */

export function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * Browsers label every fetch with `Sec-Fetch-Site`; older ones send `Origin`, which is
 * compared with the host the request reached (the forwarded one behind a proxy). The cookie
 * is SameSite=Lax as well, so a cross-site POST arrives without it; this makes the refusal explicit.
 */
export function isSameOrigin(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin' || site === 'none';
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const hosts = [request.headers.get('x-forwarded-host'), request.headers.get('host')];
  try {
    return hosts.includes(new URL(origin).host);
  } catch {
    return false;
  }
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function isSafeId(value: string): boolean {
  return ID_PATTERN.test(value);
}

type ProxyInit = { method: 'GET' | 'POST' | 'DELETE'; json?: unknown };

/**
 * Forwards `path` to the API with the session token from the cookie and answers with the
 * API's JSON and status. No session means 401 before anything leaves this server.
 */
export async function proxyWithSession(
  request: Request,
  path: string,
  init: ProxyInit,
): Promise<NextResponse> {
  if (init.method !== 'GET' && !isSameOrigin(request)) {
    return errorResponse(403, 'forbidden', 'Cross-origin requests are not accepted.');
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return errorResponse(401, 'unauthorized', 'Log in to do that.');

  try {
    const data = await apiFetch<unknown>(path, {
      method: init.method,
      json: init.json,
      token,
      cache: 'no-store',
    });
    return NextResponse.json(data ?? {}, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error.status, error.code, error.message);
    return errorResponse(502, 'api_unreachable', 'Could not reach the API. Try again shortly.');
  }
}
