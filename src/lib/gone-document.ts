import { SITE } from './site';

export const GONE_TITLE = 'This page is gone';

export const GONE_BODY =
  'This creator entry was removed. It stays out of the directory, and it does not come back.';

/**
 * The document response for a retired creator. App Router pages can answer 404, 401, and 403,
 * not 410, so the full-page request is answered from middleware with this document. It uses
 * system colors (`Canvas` / `CanvasText`) and system fonts: no hex, no images, no third party.
 */
export function goneDocument(): string {
  const title = `${GONE_TITLE} | ${SITE.name}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; background: Canvas; color: CanvasText; font-family: ui-sans-serif, system-ui, sans-serif; }
  main { max-width: 40rem; padding: 1.5rem; }
  p.label { font-family: ui-monospace, monospace; font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; margin: 0; }
  h1 { font-family: ui-monospace, monospace; font-size: 1.875rem; font-weight: 600; margin: 0.75rem 0 0; }
  p { line-height: 1.6; }
  a { color: inherit; }
</style>
</head>
<body>
<main>
<p class="label">410</p>
<h1>${escapeHtml(GONE_TITLE)}</h1>
<p>${escapeHtml(GONE_BODY)}</p>
<p><a href="/creators">Back to creators</a></p>
</main>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
