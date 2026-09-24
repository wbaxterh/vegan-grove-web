/** Everything the app schedules happens in Southern California. */
const TIME_ZONE = 'America/Los_Angeles';

const dateTime = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const timeOnly = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
});

const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, dateStyle: 'short' });

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** "Sat, Oct 4, 10:00 AM to 1:00 PM" or the full range when it crosses midnight. */
export function formatDateRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (dayKey.format(start) === dayKey.format(end)) {
    return `${dateTime.format(start)} to ${timeOnly.format(end)}`;
  }
  return `${dateTime.format(start)} to ${dateTime.format(end)}`;
}

export type Paragraph = { id: number; text: string };

/**
 * Splits markdown-ish text into paragraphs. `id` is the block's position in the source, which
 * is stable across renders and unique even when two paragraphs repeat the same text.
 * A real renderer replaces this in m2.
 */
export function paragraphs(body: string): Paragraph[] {
  const result: Paragraph[] = [];
  let cursor = 0;
  for (const raw of body.split(/\n\s*\n/)) {
    const text = raw.trim();
    if (text) result.push({ id: cursor, text });
    cursor += raw.length + 1;
  }
  return result;
}
