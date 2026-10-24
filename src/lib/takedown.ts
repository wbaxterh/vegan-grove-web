'use server';

export type TakedownState = { status: 'invalid' | 'unfiled'; message: string };

const INVALID_REQUEST = 'Describe the request in a few words, up to 1000 characters.';
const INVALID_LINK = 'Add a link to your own site or channel, starting with https://.';

/**
 * The public takedown form. It collects a request and a link, never a name or an email.
 * The API's reports route requires a session and does not accept a creator, and this app
 * stores nothing, so the text is checked and then dropped. It is not logged.
 */
export async function submitTakedown(
  _prev: TakedownState | null,
  formData: FormData,
): Promise<TakedownState> {
  const request = String(formData.get('request') ?? '').trim();
  const link = String(formData.get('link') ?? '').trim();

  if (request.length < 2 || request.length > 1000) {
    return { status: 'invalid', message: INVALID_REQUEST };
  }

  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return { status: 'invalid', message: INVALID_LINK };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { status: 'invalid', message: INVALID_LINK };
  }
  if (url.username || url.password) {
    return { status: 'invalid', message: INVALID_LINK };
  }

  return {
    status: 'unfiled',
    message:
      'This request was not filed. The removal inbox is not connected yet, so nothing was sent and nothing was stored.',
  };
}
