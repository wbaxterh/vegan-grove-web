import { notFound } from 'next/navigation';
import { ApiError, apiFetch, type ListResponse } from './api';

/**
 * Loaders for public, unauthenticated pages. They never throw on an unreachable API so a
 * build or a request with the API down renders an honest empty state instead of a 500.
 * Server components only.
 */

export const PUBLIC_REVALIDATE_SECONDS = 60;

export type LoadedList<T> = { items: T[]; unavailable: boolean };

export async function loadList<T>(path: string): Promise<LoadedList<T>> {
  try {
    const data = await apiFetch<ListResponse<T>>(path, {
      next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
    });
    return { items: data.items ?? [], unavailable: false };
  } catch {
    return { items: [], unavailable: true };
  }
}

/**
 * Resolves to the resource, calls `notFound()` on a 404, and `null` when the API is down.
 * Single resources come wrapped in a named envelope (`{ place: {...} }`, `{ event: {...} }`);
 * `key` names it. A bare object is accepted too, so a route that answers unwrapped still works.
 */
export async function loadOne<T extends { id: string }>(
  path: string,
  key: string,
): Promise<T | null> {
  try {
    const data = await apiFetch<Record<string, unknown>>(path, {
      next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
    });
    const wrapped = data[key];
    if (wrapped && typeof wrapped === 'object') return wrapped as T;
    if (typeof data.id === 'string') return data as unknown as T;
    return null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return null;
  }
}
