// A tiny stand-in for vegan-grove-api used by the Playwright suite. It answers
// with fixtures in the API's real response shapes (list envelope { items,
// nextCursor }, single-resource envelope { place: {...} }, map-pins { items })
// so server components and the browser both exercise the contract the real API
// serves. The places routes honor the same query params the API documents
// (bbox, veganLevel, types, includeChains) and the media routes honor the media
// contract (q, kind, tag, sort, free, cursor, limit) so the filter tests mean
// something. A session is any `Authorization: Bearer` header. Anything not
// listed answers 501 in the real error envelope, like the API's own stubs.
//
// Test hooks, all under /__mock:
//   POST   /__mock/media-home { status }   make GET /api/media/home answer that status
//   DELETE /__mock/media-home              restore it
//   GET    /__mock/requests?path=/api/x    the requests the mock has received for that path
import { createServer } from 'node:http';
import { deflateSync } from 'node:zlib';

const port = Number(process.env.MOCK_API_PORT ?? 4010);
const origin = `http://127.0.0.1:${port}`;

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

// ---------------------------------------------------------------------------
// Fixture images. The mock doubles as the media CDN (NEXT_PUBLIC_MEDIA_CDN_ORIGIN
// points at it in playwright.config.ts) so `next/image` and the CSP see a real
// origin. The PNGs are generated here: no binaries in the repo.

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buffer) {
  let c = -1;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}

/** An 8-bit RGB PNG; `pixel(u, v)` returns [r, g, b] for coordinates in 0..1. */
function png(width, height, pixel) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = pixel(x / width, y / height);
      const at = y * stride + 1 + x * 3;
      raw[at] = r;
      raw[at + 1] = g;
      raw[at + 2] = b;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => Math.round(a + (b - a) * Math.min(1, Math.max(0, t)));
const rgb = (from, to, t) => [
  mix(from[0], to[0], t),
  mix(from[1], to[1], t),
  mix(from[2], to[2], t),
];

const NEAR_BLACK = [11, 15, 12];
const DEEP_GREEN = [14, 124, 58];
const NEON_GREEN = [61, 255, 138];
const CYAN = [34, 229, 255];

const posterPng = png(400, 600, (u, v) => {
  const base = rgb(DEEP_GREEN, NEAR_BLACK, (u + v) / 1.6);
  const band = Math.abs(v - 0.62 + u * 0.15) < 0.02 ? 0.55 : 0;
  return rgb(base, NEON_GREEN, band);
});

const backdropPng = png(1280, 720, (u, v) => {
  const base = rgb(NEAR_BLACK, DEEP_GREEN, u * 0.8 + v * 0.2);
  const glow = Math.exp(-((u - 0.7) ** 2 + (v - 0.35) ** 2) * 9) * 0.5;
  return rgb(base, CYAN, glow);
});

const images = {
  '/cdn/posters/dominion.png': posterPng,
  '/cdn/posters/talk.png': posterPng,
  '/cdn/backdrops/dominion.png': backdropPng,
};

// ---------------------------------------------------------------------------
// Media fixtures (media contract, section 10.1). One fully enriched documentary
// (the detail page's best case), one bare film (no images, no metadata: the page
// must still read well), one short, one talk with a poster but no backdrop, and a
// generated catalog so paging, sorting, and the automatic rows have something to do.

const JUSTWATCH = 'Watch providers data by JustWatch';
const KINDS = ['documentary', 'film', 'series', 'talk', 'short'];
const TOPICS = ['ethics', 'health', 'environment', 'activism', 'investigation'];

function mediaItem(overrides) {
  return {
    releaseDate: null,
    tagline: null,
    posterUrl: null,
    backdropUrl: null,
    runtimeMinutes: null,
    contentRating: null,
    originalLanguage: null,
    directors: [],
    featuring: [],
    genres: [],
    tags: [],
    contentWarnings: [],
    rating: null,
    ratingCount: null,
    watchLinks: [],
    trailerYoutubeId: null,
    officialSite: null,
    actions: [],
    externalIds: {},
    featured: false,
    sourceUrl: null,
    stats: { saves: 0, moved: 0, acted: 0 },
    ...overrides,
  };
}

const dominion = mediaItem({
  id: '00000000000000000000000a',
  title: 'Fixture Dominion',
  slug: 'fixture-dominion',
  kind: 'documentary',
  year: 2018,
  releaseDate: '2018-03-29',
  synopsis:
    'A fixture synopsis about the cause, long enough to be clamped on a card and to read as a real paragraph on the detail page.',
  tagline: 'Fixture tagline.',
  posterUrl: `${origin}/cdn/posters/dominion.png`,
  backdropUrl: `${origin}/cdn/backdrops/dominion.png`,
  runtimeMinutes: 120,
  contentRating: 'NR',
  originalLanguage: 'en',
  directors: ['Fixture Director'],
  featuring: ['Fixture Narrator', 'Second Narrator'],
  genres: ['Documentary'],
  tags: ['ethics', 'investigation', JUSTWATCH],
  contentWarnings: ['graphic footage', 'animal death'],
  rating: 8.7,
  ratingCount: 412,
  watchLinks: [
    { provider: 'Fixture Free', url: 'https://example.test/watch', access: 'free' },
    { provider: 'Fixture Stream', url: 'https://example.test/stream', access: 'subscription' },
  ],
  trailerYoutubeId: 'abcdefghijk',
  officialSite: 'https://example.test/dominion',
  actions: [
    {
      label: 'Sign the petition',
      url: 'https://example.test/petition',
      type: 'petition',
      org: 'Fixture Org',
    },
    { label: 'Volunteer at a sanctuary', url: 'https://example.test/volunteer', type: 'volunteer' },
  ],
  externalIds: { tmdb: '1', wikidata: 'Q1', imdb: 'tt0000001' },
  featured: true,
  sourceUrl: 'https://www.wikidata.org/wiki/Q1',
  createdAt: '2026-09-10T00:00:00.000Z',
  stats: { saves: 12, moved: 5, acted: 3 },
});

const bareFilm = mediaItem({
  id: '00000000000000000000000b',
  title: 'Fixture Bare Film',
  slug: 'fixture-bare-film',
  kind: 'film',
  year: 2017,
  synopsis: '',
  tags: ['health'],
  createdAt: '2026-09-05T00:00:00.000Z',
});

const short = mediaItem({
  id: '00000000000000000000000c',
  title: 'Fixture Short',
  slug: 'fixture-short',
  kind: 'short',
  year: 2020,
  synopsis: 'Ten minutes on outreach.',
  runtimeMinutes: 10,
  genres: ['Documentary'],
  tags: ['activism', 'ethics'],
  watchLinks: [{ provider: 'Fixture Free', url: 'https://example.test/short', access: 'free' }],
  createdAt: '2026-09-12T00:00:00.000Z',
});

const talk = mediaItem({
  id: '00000000000000000000000d',
  title: 'Fixture Talk',
  slug: 'fixture-talk',
  kind: 'talk',
  year: 2023,
  synopsis: 'A talk on the environment case, with a poster but no backdrop.',
  posterUrl: `${origin}/cdn/posters/talk.png`,
  runtimeMinutes: 25,
  tags: ['environment', 'activism'],
  watchLinks: [{ provider: 'Fixture Free', url: 'https://example.test/talk', access: 'free' }],
  featured: true,
  createdAt: '2026-09-14T00:00:00.000Z',
});

const catalog = Array.from({ length: 30 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return mediaItem({
    id: (0x10 + i).toString(16).padStart(24, '0'),
    title: `Fixture Catalog ${n}`,
    slug: `fixture-catalog-${n}`,
    kind: KINDS[i % KINDS.length],
    year: 1990 + i,
    synopsis: `Catalog fixture number ${i + 1}.`,
    runtimeMinutes: 20 + i * 3,
    tags: [TOPICS[i % TOPICS.length]],
    rating: i % 3 === 0 ? null : 5 + (i % 5),
    ratingCount: i % 3 === 0 ? null : 10 + i,
    watchLinks:
      i % 4 === 0
        ? [{ provider: 'Fixture Free', url: `https://example.test/catalog/${n}`, access: 'free' }]
        : [],
    createdAt: `2026-08-${String(1 + (i % 28)).padStart(2, '0')}T00:00:00.000Z`,
  });
});

const media = [dominion, bareFilm, short, talk, ...catalog];
const byId = new Map(media.map((item) => [item.id, item]));
const bySlug = new Map(media.map((item) => [item.slug, item]));

const collections = [
  {
    id: '0000000000000000000000c1',
    slug: 'fixture-start-here',
    name: 'Start here',
    description: 'Three titles to begin with.',
    order: 1,
    itemIds: [dominion.id, short.id, talk.id],
  },
  {
    id: '0000000000000000000000c2',
    slug: 'fixture-for-skeptics',
    name: 'For skeptics',
    description: 'Titles that meet people where they are.',
    order: 2,
    itemIds: [catalog[1].id, catalog[3].id, catalog[5].id, catalog[7].id, catalog[9].id],
  },
];

// Per-run member state. One fixture member; the token is any bearer string.
const savedAt = new Map([[short.id, Date.parse('2026-09-20T00:00:00.000Z')]]);
const reactionsByMedia = new Map();

function viewerOf(item) {
  return { saved: savedAt.has(item.id), reactions: [...(reactionsByMedia.get(item.id) ?? [])] };
}

/** The fixture's base counts plus whatever this run's member has done. */
function withStats(item) {
  const mine = reactionsByMedia.get(item.id) ?? new Set();
  return {
    ...item,
    stats: {
      saves: item.stats.saves + (savedAt.has(item.id) ? 1 : 0),
      moved: item.stats.moved + (mine.has('moved') ? 1 : 0),
      acted: item.stats.acted + (mine.has('acted') ? 1 : 0),
    },
  };
}

const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt);
const isFree = (item) => item.watchLinks.some((link) => link.access === 'free');

const SORTS = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || newestFirst(a, b),
  release: (a, b) => (b.year ?? 0) - (a.year ?? 0),
  title: (a, b) => a.title.localeCompare(b.title),
  rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
  runtime: (a, b) => (a.runtimeMinutes ?? Infinity) - (b.runtimeMinutes ?? Infinity),
};

function matchesQuery(item, q) {
  const haystack = [
    item.title,
    item.tagline ?? '',
    item.synopsis,
    ...item.directors,
    ...item.featuring,
    ...item.tags,
    ...item.genres,
  ]
    .join('\n')
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

/** `GET /api/media`: the contract's filters, sorts, and offset cursors. */
function listMedia(query) {
  const q = query.get('q');
  const kind = query.get('kind');
  const tag = query.get('tag');
  const year = Number(query.get('year'));
  const maxRuntime = Number(query.get('maxRuntime'));
  let items = media.filter(
    (item) =>
      (!q || matchesQuery(item, q)) &&
      (!kind || item.kind === kind) &&
      (!tag || item.tags.includes(tag)) &&
      (!year || item.year === year) &&
      (query.get('free') !== '1' || isFree(item)) &&
      (!maxRuntime || (item.runtimeMinutes ?? Infinity) <= maxRuntime),
  );
  items = [...items].sort(SORTS[query.get('sort')] ?? SORTS.featured);
  const limit = Math.min(100, Number(query.get('limit')) || 24);
  const offset = Number(query.get('cursor')) || 0;
  const page = items.slice(offset, offset + limit).map(withStats);
  const nextCursor = offset + limit < items.length ? String(offset + limit) : null;
  return { items: page, nextCursor };
}

function collectionItems(collection, limit = Infinity) {
  return collection.itemIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .slice(0, limit)
    .map(withStats);
}

function serializeCollection(collection, limit) {
  const { itemIds: _omit, ...rest } = collection;
  return { ...rest, items: collectionItems(collection, limit) };
}

/** `GET /api/media/home`: collections first, then the automatic rows with two or more items. */
function home() {
  const hero = media.filter((item) => item.featured).map(withStats);
  const row = (key, name, description, items) => ({
    key,
    name,
    description,
    kind: 'auto',
    slug: null,
    items: items.slice(0, 12).map(withStats),
  });
  const newest = [...media].sort(newestFirst);
  const rows = [
    ...collections.map((collection) => ({
      key: `collection:${collection.slug}`,
      name: collection.name,
      description: collection.description,
      kind: 'collection',
      slug: collection.slug,
      items: collectionItems(collection, 12),
    })),
    row('auto:newest', 'New to the library', null, newest),
    row(
      'auto:free',
      'Free to watch',
      'No account, no card, just press play.',
      newest.filter(isFree),
    ),
    row(
      'auto:short',
      'Under 30 minutes',
      null,
      newest.filter((item) => item.runtimeMinutes !== null && item.runtimeMinutes <= 30),
    ),
    ...TOPICS.map((topic) =>
      row(
        `auto:tag:${topic}`,
        topic.charAt(0).toUpperCase() + topic.slice(1),
        null,
        newest.filter((item) => item.tags.includes(topic)),
      ),
    ),
  ];
  return { hero, rows: rows.filter((entry) => entry.items.length >= 2) };
}

/** `GET /api/media/:slug/related`: shared tags or genres, most shared first, then newest. */
function related(item) {
  const mine = new Set([...item.tags, ...item.genres]);
  return media
    .filter((other) => other.id !== item.id)
    .map((other) => ({
      other,
      shared: [...other.tags, ...other.genres].filter((value) => mine.has(value)).length,
    }))
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.shared - a.shared || newestFirst(a.other, b.other))
    .slice(0, 12)
    .map((entry) => withStats(entry.other));
}

const fixtureMember = {
  id: '0000000000000000000000f1',
  handle: 'fixture_member',
  homeArea: 'long_beach',
  publicPostsEnabled: false,
  interests: [],
  role: 'member',
};

const notFound = (what) => [404, { error: { code: 'not_found', message: `No such ${what}` } }];
const unauthorized = () => [401, { error: { code: 'unauthorized', message: 'Log in first' } }];
const notImplemented = (path) => [501, { error: { code: 'not_implemented', message: path } }];

// Test hooks and the request log.
const control = { mediaHomeStatus: 200 };
const requests = [];

function record(req, url, auth) {
  requests.push({ method: req.method, path: url.pathname, query: url.search, auth });
  if (requests.length > 2000) requests.shift();
}

// Each route: [method, pattern, handler({ match, query, auth, body }) => [status, json]].
const routes = [
  ['GET', /^\/healthz$/, () => [200, { ok: true }]],

  [
    'POST',
    /^\/__mock\/media-home$/,
    ({ body }) => {
      control.mediaHomeStatus = Number(body?.status) || 200;
      return [200, { status: control.mediaHomeStatus }];
    },
  ],
  [
    'DELETE',
    /^\/__mock\/media-home$/,
    () => {
      control.mediaHomeStatus = 200;
      return [200, { status: 200 }];
    },
  ],
  [
    'GET',
    /^\/__mock\/requests$/,
    ({ query }) => {
      const path = query.get('path');
      return [200, { items: path ? requests.filter((entry) => entry.path === path) : requests }];
    },
  ],

  [
    'GET',
    /^\/api\/stats$/,
    () => [
      200,
      { places: 3, upcomingEvents: 0, groves: 0, guides: 0, media: media.length, members: 0 },
    ],
  ],

  ['GET', /^\/api\/me$/, ({ auth }) => (auth ? [200, fixtureMember] : unauthorized())],
  [
    'GET',
    /^\/api\/me\/watchlist$/,
    ({ auth }) => {
      if (!auth) return unauthorized();
      const items = [...savedAt.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => byId.get(id))
        .filter(Boolean)
        .map(withStats);
      return [200, { items, nextCursor: null }];
    },
  ],

  [
    'GET',
    /^\/api\/media\/home$/,
    () => (control.mediaHomeStatus === 200 ? [200, home()] : notImplemented('/api/media/home')),
  ],
  [
    'GET',
    /^\/api\/media\/collections$/,
    () => [200, { items: collections.map((collection) => serializeCollection(collection, 4)) }],
  ],
  [
    'GET',
    /^\/api\/media\/collections\/([^/]+)$/,
    ({ match }) => {
      const collection = collections.find((entry) => entry.slug === match[1]);
      return collection
        ? [200, { collection: serializeCollection(collection) }]
        : notFound('collection');
    },
  ],
  ['GET', /^\/api\/media$/, ({ query }) => [200, listMedia(query)]],
  [
    'GET',
    /^\/api\/media\/([^/]+)\/related$/,
    ({ match }) => {
      // The bare film's related endpoint is broken on purpose: the page must omit the shelf.
      if (match[1] === bareFilm.slug) return notImplemented('/api/media/related');
      const item = bySlug.get(match[1]);
      return item ? [200, { items: related(item) }] : notFound('title');
    },
  ],
  [
    'POST',
    /^\/api\/media\/([^/]+)\/save$/,
    ({ match, auth }) => {
      if (!auth) return unauthorized();
      const item = byId.get(match[1]) ?? bySlug.get(match[1]);
      if (!item) return notFound('title');
      if (!savedAt.has(item.id)) savedAt.set(item.id, Date.now());
      return [200, { saved: true }];
    },
  ],
  [
    'DELETE',
    /^\/api\/media\/([^/]+)\/save$/,
    ({ match, auth }) => {
      if (!auth) return unauthorized();
      const item = byId.get(match[1]) ?? bySlug.get(match[1]);
      if (!item) return notFound('title');
      savedAt.delete(item.id);
      return [200, { saved: false }];
    },
  ],
  [
    'POST',
    /^\/api\/media\/([^/]+)\/reactions$/,
    ({ match, auth, body }) => {
      if (!auth) return unauthorized();
      const item = byId.get(match[1]) ?? bySlug.get(match[1]);
      if (!item) return notFound('title');
      if (body?.type !== 'moved' && body?.type !== 'acted') {
        return [400, { error: { code: 'bad_request', message: 'type' } }];
      }
      const mine = reactionsByMedia.get(item.id) ?? new Set();
      mine.add(body.type);
      reactionsByMedia.set(item.id, mine);
      return [200, { stats: withStats(item).stats, viewer: viewerOf(item) }];
    },
  ],
  [
    'DELETE',
    /^\/api\/media\/([^/]+)\/reactions\/(moved|acted)$/,
    ({ match, auth }) => {
      if (!auth) return unauthorized();
      const item = byId.get(match[1]) ?? bySlug.get(match[1]);
      if (!item) return notFound('title');
      reactionsByMedia.get(item.id)?.delete(match[2]);
      return [200, { stats: withStats(item).stats, viewer: viewerOf(item) }];
    },
  ],
  [
    'GET',
    /^\/api\/media\/([^/]+)$/,
    ({ match, auth }) => {
      const item = bySlug.get(match[1]);
      if (!item) return notFound('title');
      const body = { media: withStats(item) };
      if (auth) body.viewer = viewerOf(item);
      return [200, body];
    },
  ],

  [
    'GET',
    /^\/api\/places\/map-pins$/,
    ({ query }) => [200, { items: filterPlaces(query).map(toPin) }],
  ],
  [
    'GET',
    /^\/api\/places$/,
    ({ query }) => [200, { items: filterPlaces(query), nextCursor: null }],
  ],
  ...places.map((place) => [
    'GET',
    new RegExp(`^/api/places/${place.slug}$`),
    () => [200, { place }],
  ]),
  ['GET', /^\/api\/places\/[^/]+$/, () => notFound('place')],
];

function readJson(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : null);
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const method = req.method ?? 'GET';

  if (method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  const image = images[url.pathname];
  if (image) {
    res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=3600' });
    res.end(image);
    return;
  }

  const auth = /^Bearer\s+\S+/.test(req.headers.authorization ?? '');
  if (!url.pathname.startsWith('/__mock')) record(req, url, auth);
  const body = method === 'POST' ? await readJson(req) : null;

  let result = null;
  for (const [routeMethod, pattern, handler] of routes) {
    const match = url.pathname.match(pattern);
    if (match && routeMethod === method) {
      result = handler({ match, query: url.searchParams, auth, body });
      break;
    }
  }
  const [status, payload] = result ?? notImplemented(url.pathname);
  res.writeHead(status, { 'content-type': 'application/json', ...CORS });
  res.end(JSON.stringify(payload));
}).listen(port, '127.0.0.1', () => {
  console.log(`mock api listening on ${origin}`);
});
