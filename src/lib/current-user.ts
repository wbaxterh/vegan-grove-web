import { cache } from 'react';
import { ApiError } from './api';
import { apiFetchServer } from './api.server';
import type { CurrentUser } from './types';

export type CurrentUserResult =
  | { status: 'ok'; user: CurrentUser }
  | { status: 'expired'; user: null }
  | { status: 'unavailable'; user: null };

/**
 * `GET /api/me` for the signed-in member, memoized per request so the app layout and a page
 * in it share one call. Server components only.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUserResult> => {
  try {
    const user = await apiFetchServer<CurrentUser>('/me');
    return { status: 'ok', user };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return { status: 'expired', user: null };
    }
    return { status: 'unavailable', user: null };
  }
});
