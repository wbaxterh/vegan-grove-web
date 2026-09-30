import { errorResponse, isSafeId, proxyWithSession } from '@/lib/api-proxy';

type Context = { params: Promise<{ id: string }> };

/** `POST` saves a title to the member's watchlist, `DELETE` removes it. Both are idempotent upstream. */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  if (!isSafeId(id)) return errorResponse(400, 'bad_request', 'Invalid media id.');
  return proxyWithSession(request, `/media/${id}/save`, { method: 'POST' });
}

export async function DELETE(request: Request, { params }: Context) {
  const { id } = await params;
  if (!isSafeId(id)) return errorResponse(400, 'bad_request', 'Invalid media id.');
  return proxyWithSession(request, `/media/${id}/save`, { method: 'DELETE' });
}
