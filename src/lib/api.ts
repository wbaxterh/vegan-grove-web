/**
 * The one HTTP client for the Vegan Grove API.
 *
 * Paths are relative to `NEXT_PUBLIC_API_BASE_URL`, which already includes the `/api`
 * prefix, so call `apiFetch('/places?bbox=...')`, not `apiFetch('/api/places')`.
 *
 * Browser code never holds a session token: the token lives in the httpOnly `vg_session`
 * cookie and is attached on the server by `apiFetchServer` (see `api.server.ts`).
 */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api'
).replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 10_000;

/** Error envelope the API returns on every non-2xx response. */
export type ApiErrorBody = { error: { code: string; message: string } };

/** Cursor-paginated list envelope. The API never uses page/skip. */
export type ListResponse<T> = { items: T[]; nextCursor: string | null };

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export type ApiFetchInit = Omit<RequestInit, 'body'> & {
  /** Serialized as the JSON body; sets Content-Type. */
  json?: unknown;
  /** Raw body for the rare non-JSON request (uploads go straight to S3, not here). */
  body?: BodyInit | null;
  /** Session token, only ever supplied by server code. */
  token?: string;
  timeoutMs?: number;
};

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const error = (value as { error: unknown }).error;
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: unknown }).code === 'string' &&
    typeof (error as { message?: unknown }).message === 'string'
  );
}

function buildUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { json, token, timeoutMs, headers: initHeaders, ...rest } = init;

  const headers = new Headers(initHeaders);
  headers.set('Accept', 'application/json');
  if (json !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(buildUrl(path), {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    // The API is a different origin and auth is a bearer header, never a cookie.
    credentials: 'omit',
    signal: rest.signal ?? AbortSignal.timeout(timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (isApiErrorBody(data)) {
      throw new ApiError(response.status, data.error.code, data.error.message);
    }
    throw new ApiError(
      response.status,
      `http_${response.status}`,
      response.statusText || 'Request failed',
    );
  }

  return data as T;
}

/** True when the failure is the API being down or unreachable rather than a real response. */
export function isUnreachable(error: unknown): boolean {
  return !(error instanceof ApiError);
}
