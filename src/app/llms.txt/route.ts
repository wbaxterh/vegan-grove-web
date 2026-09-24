import { SITE } from '@/lib/site';

export const dynamic = 'force-static';

export function GET() {
  const body = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.tagline}`,
    '',
    'Vegan Grove helps activists find sanctuaries, vegan places, events, and local chapters',
    '(Groves) in Southern California, then get out the door and act. Member profiles are never',
    'public, the app collects the minimum, and there is no third-party analytics.',
    '',
    '## Docs',
    '',
    `- Product, privacy, and architecture documentation: ${SITE.docsUrl}`,
    `- Source: ${SITE.sourceUrl}`,
    '',
    '## Public pages',
    '',
    `- ${SITE.url}/places`,
    `- ${SITE.url}/events`,
    `- ${SITE.url}/groves`,
    `- ${SITE.url}/media`,
    `- ${SITE.url}/guides`,
    `- ${SITE.url}/privacy`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
