// A tiny stand-in for vegan-grove-api used by the Playwright suite. It answers
// with fixtures in the API's real response shapes (list envelope { items,
// nextCursor }, single-resource envelope { place: {...} }) so server components
// and the browser both exercise the contract the real API serves. Anything not
// listed answers 501 in the real error envelope, like the API's own stubs.
import { createServer } from 'node:http';

const port = Number(process.env.MOCK_API_PORT ?? 4010);

const place = {
  id: '000000000000000000000001',
  name: 'Fixture Sanctuary',
  slug: 'fixture-sanctuary',
  type: 'sanctuary',
  veganLevel: 'full',
  location: { lng: -118.19, lat: 33.83 },
  address: '1 Fixture Way',
  city: 'Long Beach',
  area: 'long_beach',
  website: 'https://example.org',
  hours: null,
  tags: ['fixture'],
  description: 'A sanctuary that exists only in the test suite.',
  photoKeys: [],
  ratingAvg: 0,
  reviewCount: 0,
};

const routes = [
  [/^\/healthz$/, () => [200, { ok: true }]],
  [
    /^\/api\/stats$/,
    () => [200, { places: 1, upcomingEvents: 0, groves: 0, guides: 0, media: 0, members: 0 }],
  ],
  [/^\/api\/places$/, () => [200, { items: [place], nextCursor: null }]],
  [/^\/api\/places\/fixture-sanctuary$/, () => [200, { place }]],
  [
    /^\/api\/places\/[^/]+$/,
    () => [404, { error: { code: 'not_found', message: 'No such place' } }],
  ],
];

createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  const match = routes.find(([re]) => re.test(path));
  const [status, body] = match
    ? match[1]()
    : [501, { error: { code: 'not_implemented', message: path } }];
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, content-type',
  });
  res.end(JSON.stringify(body));
}).listen(port, '127.0.0.1', () => {
  console.log(`mock api listening on http://127.0.0.1:${port}`);
});
