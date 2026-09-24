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

/** Resolves to the resource, calls `notFound()` on a 404, and `null` when the API is down. */
export async function loadOne<T>(path: string): Promise<T | null> {
  try {
    return await apiFetch<T>(path, { next: { revalidate: PUBLIC_REVALIDATE_SECONDS } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return null;
  }
}
