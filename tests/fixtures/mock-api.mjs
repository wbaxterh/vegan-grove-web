// A tiny stand-in for vegan-grove-api used by the Playwright suite. It answers
// with fixtures in the API's real response shapes (list envelope { items,
// nextCursor }, single-resource envelope { place: {...} }, map-pins { items })
// so server components and the browser both exercise the contract the real API
// serves. The places routes honor the same query params the API documents
// (bbox, veganLevel, types, includeChains) so the filter tests mean something.
// Anything not listed answers 501 in the real error envelope, like the API's
// own stubs.
import { createServer } from 'node:http';

const port = Number(process.env.MOCK_API_PORT ?? 4010);

const sanctuary = {
  id: '000000000000000000000001',
  source: 'curated',
  name: 'Fixture Sanctuary',
  slug: 'fixture-sanctuary',
  type: 'sanctuary',
  veganLevel: 'full',
  chain: false,
  location: { lng: -118.19, lat: 33.83 },
  address: '1 Fixture Way',
  city: 'Long Beach',
  postcode: '90802',
  area: 'long_beach',
  website: 'https://example.org',
  phone: '+1 562 555 0100',
  hours: 'Sa-Su 10:00-16:00; Mo-Fr by appointment',
  tags: ['fixture'],
  description: 'A sanctuary that exists only in the test suite.',
  photoKeys: [],
  ratingAvg: 0,
  reviewCount: 0,
};

const garden = {
  id: '000000000000000000000002',
  source: 'osm',
  name: 'Fixture Community Garden',
  slug: 'fixture-community-garden',
  type: 'garden',
  veganLevel: 'full',
  chain: false,
  location: { lng: -118.17, lat: 33.8 },
  address: '2 Allotment Lane',
  city: 'Long Beach',
  postcode: '90804',
  area: 'long_beach',
  hours: 'Mo-Su 07:00-19:00',
  tags: ['osm', 'community'],
  description: 'Community garden in Long Beach.',
  photoKeys: [],
  ratingAvg: 0,
  reviewCount: 0,
};

const chainCafe = {
  id: '000000000000000000000003',
  source: 'osm',
  name: 'Fixture Chain Cafe',
  slug: 'fixture-chain-cafe',
  type: 'cafe',
  veganLevel: 'options',
  chain: true,
  location: { lng: -118.15, lat: 33.77 },
  address: '3 Franchise Blvd',
  city: 'Long Beach',
  postcode: '90803',
  area: 'long_beach',
  website: 'https://example.com',
  phone: '+1 562 555 0199',
  hours: 'Mo-Fr 06:00-20:00; Sa-Su 07:00-18:00',
  tags: ['osm', 'coffee_shop'],
  description: 'Cafe with vegan options in Long Beach. Cuisine: coffee_shop.',
  photoKeys: [],
  ratingAvg: 0,
  reviewCount: 0,
};

const places = [sanctuary, garden, chainCafe];

function inBbox(place, bbox) {
  if (!bbox) return true;
  const [w, s, e, n] = bbox.split(',').map(Number);
  if ([w, s, e, n].some(Number.isNaN)) return true;
  const { lng, lat } = place.location;
  return lng >= w && lng <= e && lat >= s && lat <= n;
}

/** Same defaults as the API: fully vegan only, every type, chains hidden. */
function filterPlaces(query) {
  const level = query.get('veganLevel') ?? 'full';
  const types = query.get('types')?.split(',').filter(Boolean);
  const includeChains = query.get('includeChains') === 'true';
  return places.filter((place) => {
    if (level !== 'all' && place.veganLevel !== level) return false;
    if (types && !types.includes(place.type)) return false;
    if (!includeChains && place.chain) return false;
    return inBbox(place, query.get('bbox'));
  });
}

function toPin({ id, slug, name, type, veganLevel, chain, location }) {
  return { id, slug, name, type, veganLevel, chain, location };
}

const routes = [
  [/^\/healthz$/, () => [200, { ok: true }]],
  [
    /^\/api\/stats$/,
    () => [200, { places: 3, upcomingEvents: 0, groves: 0, guides: 0, media: 0, members: 0 }],
  ],
  [/^\/api\/places\/map-pins$/, (query) => [200, { items: filterPlaces(query).map(toPin) }]],
  [/^\/api\/places$/, (query) => [200, { items: filterPlaces(query), nextCursor: null }]],
  ...places.map((place) => [new RegExp(`^/api/places/${place.slug}$`), () => [200, { place }]]),
  [
    /^\/api\/places\/[^/]+$/,
    () => [404, { error: { code: 'not_found', message: 'No such place' } }],
  ],
];

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const match = routes.find(([re]) => re.test(url.pathname));
  const [status, body] = match
    ? match[1](url.searchParams)
    : [501, { error: { code: 'not_implemented', message: url.pathname } }];
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, content-type',
  });
  res.end(JSON.stringify(body));
}).listen(port, '127.0.0.1', () => {
  console.log(`mock api listening on http://127.0.0.1:${port}`);
});
