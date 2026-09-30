import { errorResponse, isSafeId, proxyWithSession } from '@/lib/api-proxy';

type Context = { params: Promise<{ id: string; type: string }> };

/** `DELETE /api/media/:id/reactions/:type` withdraws the member's reaction of that type. */
export async function DELETE(request: Request, { params }: Context) {
  const { id, type } = await params;
  if (!isSafeId(id)) return errorResponse(400, 'bad_request', 'Invalid media id.');
  if (type !== 'moved' && type !== 'acted') {
    return errorResponse(400, 'bad_request', 'type must be "moved" or "acted".');
  }
  return proxyWithSession(request, `/media/${id}/reactions/${type}`, { method: 'DELETE' });
}
