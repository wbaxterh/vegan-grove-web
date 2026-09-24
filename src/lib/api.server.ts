import { cookies } from 'next/headers';
import { type ApiFetchInit, apiFetch } from './api';
import { SESSION_COOKIE } from './session';

/**
 * Server-only variant of `apiFetch`: reads the httpOnly `vg_session` cookie and forwards it
 * as `Authorization: Bearer`. Lives in its own module because `next/headers` cannot be
 * imported from client components, and `api.ts` is shared with them.
 *
 * Anything that reads the cookie is rendered per request, which is what the `/app` area wants.
 */
export async function apiFetchServer<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return apiFetch<T>(path, { cache: 'no-store', ...init, token });
}
