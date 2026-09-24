export const DEFAULT_AFTER_LOGIN = '/app/feed';

/** Only same-origin absolute paths survive; anything else is an open redirect. */
export function safeNextPath(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate?.startsWith('/') || candidate.startsWith('//')) {
    return DEFAULT_AFTER_LOGIN;
  }
  return candidate;
}
