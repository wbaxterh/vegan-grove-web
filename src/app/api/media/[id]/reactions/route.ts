import { errorResponse, isSafeId, proxyWithSession } from '@/lib/api-proxy';
import type { MediaReaction } from '@/lib/types';

type Context = { params: Promise<{ id: string }> };

const REACTIONS = new Set<MediaReaction>(['moved', 'acted']);

/** `POST { type: 'moved' | 'acted' }` records one reaction per (title, member, type). */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  if (!isSafeId(id)) return errorResponse(400, 'bad_request', 'Invalid media id.');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'bad_request', 'Body must be JSON.');
  }
  const type = (body as { type?: unknown } | null)?.type;
  if (typeof type !== 'string' || !REACTIONS.has(type as MediaReaction)) {
    return errorResponse(400, 'bad_request', 'type must be "moved" or "acted".');
  }
  return proxyWithSession(request, `/media/${id}/reactions`, { method: 'POST', json: { type } });
}
