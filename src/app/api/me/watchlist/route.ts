import { proxyWithSession } from '@/lib/api-proxy';

/**
 * Next page of the member's watchlist for the "Load more" button. The first page is rendered
 * on the server; later pages go through here so the session stays in the cookie.
 */
export async function GET(request: Request) {
  const cursor = new URL(request.url).searchParams.get('cursor');
  const params = new URLSearchParams();
  if (cursor && /^[A-Za-z0-9_.:=-]{1,200}$/.test(cursor)) params.set('cursor', cursor);
  const query = params.toString();
  return proxyWithSession(request, `/me/watchlist${query ? `?${query}` : ''}`, { method: 'GET' });
}
