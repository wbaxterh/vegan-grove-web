import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ApiError, apiFetch } from '@/lib/api';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';
import type { CurrentUser } from '@/lib/types';

/**
 * Session proxy. The browser talks to this route, this route talks to the API, and the
 * session token only ever lives in the httpOnly `vg_session` cookie. The JSON response
 * carries the user, never the token.
 *
 *   POST   { mode: 'password', email, password }
 *   POST   { mode: 'magic-link-verify', token }
 *   POST   { mode: 'register', email, password, handle }
 *   DELETE (clears the cookie and revokes the session upstream)
 */

type SessionRequest =
  | { mode: 'password'; email: string; password: string }
  | { mode: 'magic-link-verify'; token: string }
  | { mode: 'register'; email: string; password: string; handle: string };

type AuthResponse = { token: string; user: CurrentUser };

const HANDLE_PATTERN = /^[a-z0-9_]{3,24}$/;

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function parseSessionRequest(body: unknown): SessionRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const input = body as Record<string, unknown>;
  const email = str(input.email)?.trim().toLowerCase() ?? null;
  const password = str(input.password);

  switch (input.mode) {
    case 'password':
      return email && password ? { mode: 'password', email, password } : null;
    case 'magic-link-verify': {
      const token = str(input.token);
      return token ? { mode: 'magic-link-verify', token } : null;
    }
    case 'register': {
      const handle = str(input.handle)?.trim().toLowerCase() ?? null;
      if (!email || !password || !handle || !HANDLE_PATTERN.test(handle)) return null;
      return { mode: 'register', email, password, handle };
    }
    default:
      return null;
  }
}

function upstreamFor(request: SessionRequest): { path: string; json: Record<string, string> } {
  switch (request.mode) {
    case 'password':
      return { path: '/auth/login', json: { email: request.email, password: request.password } };
    case 'magic-link-verify':
      return { path: '/auth/magic-link/verify', json: { token: request.token } };
    case 'register':
      return {
        path: '/auth/register',
        json: { email: request.email, password: request.password, handle: request.handle },
      };
  }
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'bad_request', 'Body must be JSON.');
  }

  const parsed = parseSessionRequest(body);
  if (!parsed) return errorResponse(400, 'bad_request', 'Missing or invalid fields.');

  const upstream = upstreamFor(parsed);
  try {
    const auth = await apiFetch<AuthResponse>(upstream.path, {
      method: 'POST',
      json: upstream.json,
      cache: 'no-store',
    });
    const response = NextResponse.json({ user: auth.user });
    response.cookies.set(SESSION_COOKIE, auth.token, sessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error.status, error.code, error.message);
    return errorResponse(502, 'api_unreachable', 'Could not reach the API. Try again shortly.');
  }
}

export async function DELETE() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await apiFetch<void>('/auth/logout', { method: 'POST', token, cache: 'no-store' });
    } catch {
      // Best effort: the cookie is cleared regardless, and the API's TTL finishes the job.
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0));
  return response;
}
