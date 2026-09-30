import {
  type APIRequestContext,
  type BrowserContext,
  expect,
  type Page,
  test,
} from '@playwright/test';

/**
 * The media library against the mock API (tests/fixtures/mock-api.mjs). Server components
 * fetch from the mock, so filter assertions read the mock's request log rather than the
 * browser's network; the client islands (load more, save, reactions) are asserted both ways.
 */

const BASE_URL = `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? '3000'}`;
/**
 * A filter change is a `router.replace` that waits for the server to re-render the grid. The
 * dev server compiles other routes on demand while the suite runs in parallel, so that round
 * trip can take several seconds; the places tests give the map the same allowance.
 */
const NAV_TIMEOUT = 20_000;
const MOCK_URL = `http://127.0.0.1:${process.env.MOCK_API_PORT ?? '4010'}`;

type Recorded = { method: string; path: string; query: string; auth: boolean };

async function recorded(request: APIRequestContext, path: string): Promise<Recorded[]> {
  const response = await request.get(
    `${MOCK_URL}/__mock/requests?path=${encodeURIComponent(path)}`,
  );
  return ((await response.json()) as { items: Recorded[] }).items;
}

/** The middleware only checks that the cookie exists; the mock treats any bearer as a session. */
async function signIn(context: BrowserContext) {
  await context.addCookies([{ name: 'vg_session', value: 'fixture-session', url: BASE_URL }]);
}

const hero = (page: Page) => page.getByTestId('media-hero');
const shelves = (page: Page) => page.getByTestId('media-shelf');
const gridCards = (page: Page) => page.getByTestId('media-grid').getByTestId('poster-card');
const pill = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function jsonLd(page: Page): Promise<Array<Record<string, unknown>>> {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return scripts.map((text) => JSON.parse(text) as Record<string, unknown>);
}

test('/media renders the hero and at least two shelves from the mock', async ({ page }) => {
  await page.goto('/media');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Media library');

  await expect(hero(page)).toBeVisible();
  await expect(hero(page)).toContainText('Fixture Dominion');
  await expect(hero(page).getByRole('link', { name: 'More info' })).toHaveAttribute(
    'href',
    '/media/fixture-dominion',
  );
  // Two featured titles: the dots are the carousel's tabs.
  await expect(hero(page).getByRole('tab')).toHaveCount(2);

  expect(await shelves(page).count()).toBeGreaterThanOrEqual(2);
  const startHere = page.getByRole('region', { name: 'Start here' });
  await expect(startHere.getByRole('link', { name: 'See all' })).toHaveAttribute(
    'href',
    '/media/collections/fixture-start-here',
  );
  await expect(startHere.getByTestId('poster-card')).toHaveCount(3);
  await expect(page.getByRole('region', { name: 'Free to watch' })).toBeVisible();

  // The browse grid follows the shelves with the first page of 24.
  await expect(gridCards(page)).toHaveCount(24);
  await expect(page.getByTestId('no-hosting-note')).toBeVisible();
});

test('a title without a poster gets a generated one', async ({ page }) => {
  await page.goto('/media?kind=film');
  // With a filter set, only the grid shows.
  await expect(hero(page)).toHaveCount(0);
  await expect(shelves(page)).toHaveCount(0);
  await expect(pill(page, 'Film')).toHaveAttribute('aria-pressed', 'true');

  const card = page.getByRole('link', { name: /fixture bare film/i }).first();
  await expect(card).toBeVisible();
  await expect(card.getByTestId('poster-fallback')).toBeVisible();
  await expect(card.getByTestId('poster-fallback')).toContainText('Film 2017');

  // The enriched title carries a real poster in the same grid, no fallback.
  await page.goto('/media?kind=documentary');
  const enriched = page.getByRole('link', { name: /fixture dominion/i }).first();
  await expect(enriched.locator('img')).toHaveCount(1);
  await expect(enriched.getByTestId('poster-fallback')).toHaveCount(0);
});

test('search, kind, and sort land in the URL and reach the API', async ({ page, request }) => {
  await page.goto('/media');
  await expect(hero(page)).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search the library' }).fill('outreach');
  await expect(page).toHaveURL(/\/media\?q=outreach$/, { timeout: NAV_TIMEOUT });
  await expect(hero(page)).toHaveCount(0);
  await expect(gridCards(page)).toHaveCount(1);
  await expect(page.getByRole('link', { name: /fixture short/i })).toBeVisible();

  await pill(page, 'Short').click();
  await expect(page).toHaveURL(/\/media\?q=outreach&kind=short$/, { timeout: NAV_TIMEOUT });
  await expect(pill(page, 'Short')).toHaveAttribute('aria-pressed', 'true');

  await page.getByLabel('Sort').selectOption('title');
  await expect(page).toHaveURL(/\/media\?q=outreach&kind=short&sort=title$/, {
    timeout: NAV_TIMEOUT,
  });
  await expect(gridCards(page)).toHaveCount(1);

  // The server rendered the grid for that URL, so the mock saw the same filters.
  const hits = await recorded(request, '/api/media');
  expect(
    hits.some(
      (hit) =>
        hit.query.includes('q=outreach') &&
        hit.query.includes('kind=short') &&
        hit.query.includes('sort=title'),
    ),
  ).toBe(true);

  // Clearing the kind keeps the rest of the state.
  await pill(page, 'All').click();
  await expect(page).toHaveURL(/\/media\?q=outreach&sort=title$/, { timeout: NAV_TIMEOUT });
});

test('a topic filter from the URL shows the grid only, with a removable chip', async ({ page }) => {
  await page.goto('/media?tag=ethics');
  await expect(hero(page)).toHaveCount(0);
  await expect(shelves(page)).toHaveCount(0);
  await expect(page.getByRole('link', { name: /fixture dominion/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /fixture bare film/i })).toHaveCount(0);

  await page.getByRole('button', { name: 'Remove the ethics topic filter' }).click();
  await expect(page).toHaveURL(/\/media$/, { timeout: NAV_TIMEOUT });
  await expect(hero(page)).toBeVisible();
});

test('the browse grid loads the next page with the cursor', async ({ page }) => {
  await page.goto('/media?sort=title');
  await expect(gridCards(page)).toHaveCount(24);
  await expect(gridCards(page).first()).toContainText('Fixture Bare Film');

  const more = page.getByRole('button', { name: 'Load more' });
  const nextPage = page.waitForRequest(
    (req) => req.url().includes('/api/media?') && req.url().includes('cursor=24'),
  );
  await more.click();
  await nextPage;
  await expect(gridCards(page)).toHaveCount(34);
  await expect(more).toHaveCount(0);
});

test('/media/[slug] shows everything the contract lists', async ({ page }) => {
  const response = await page.goto('/media/fixture-dominion');
  expect(response?.status()).toBe(200);

  await expect(page.getByTestId('media-kicker')).toContainText('Documentary / 2018 / 2h / NR');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fixture Dominion');
  await expect(page.getByText('Fixture tagline.')).toBeVisible();
  await expect(page.getByText('8.7 on TMDB from 412 ratings')).toBeVisible();
  await expect(page.getByTestId('media-poster').locator('img')).toHaveCount(1);

  // Where to watch: every provider with its access badge, plus the JustWatch line.
  const watch = page.getByTestId('watch-links');
  const free = watch.getByRole('link', { name: /fixture free/i });
  await expect(free).toHaveAttribute('href', 'https://example.test/watch');
  await expect(free.locator('[data-access="free"]')).toHaveText('Free');
  await expect(
    watch.getByRole('link', { name: /fixture stream/i }).locator('[data-access="subscription"]'),
  ).toHaveText('Subscription');
  await expect(page.getByText('Watch providers data by JustWatch.')).toBeVisible();

  // Credits card.
  const credits = page.getByTestId('media-credits');
  await expect(credits).toContainText('Fixture Director');
  await expect(credits).toContainText('Fixture Narrator, Second Narrator');
  await expect(credits).toContainText('English');
  await expect(credits).toContainText('2018-03-29');
  await expect(credits.getByRole('link', { name: 'Official site' })).toHaveAttribute(
    'href',
    'https://example.test/dominion',
  );
  await expect(credits.getByRole('link', { name: 'IMDb' })).toHaveAttribute(
    'href',
    'https://www.imdb.com/title/tt0000001/',
  );

  // Content warnings, actions, and the catalog-not-host note.
  await expect(page.getByTestId('content-warnings')).toContainText('graphic footage');
  await expect(page.getByTestId('content-warnings')).toContainText('animal death');
  const actions = page.getByTestId('take-action');
  await expect(actions.getByRole('link', { name: /sign the petition/i })).toHaveAttribute(
    'href',
    'https://example.test/petition',
  );
  await expect(actions).toContainText('Petition / Fixture Org');
  await expect(page.getByTestId('no-hosting-note')).toContainText('does not host films');

  // Trailer is click-to-load and only ever from the no-cookie domain.
  const trailer = page.getByRole('button', { name: /load the trailer/i });
  await expect(trailer).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  await trailer.click();
  await expect(page.locator('iframe')).toHaveAttribute(
    'src',
    /^https:\/\/www\.youtube-nocookie\.com\/embed\/abcdefghijk/,
  );

  // Related shelf from /related.
  const relatedShelf = page.getByRole('region', { name: 'Related' });
  await expect(relatedShelf).toBeVisible();
  await expect(relatedShelf.getByRole('link', { name: /fixture short/i })).toBeVisible();
  await expect(relatedShelf.getByRole('link', { name: /fixture dominion/i })).toHaveCount(0);

  // Signed out: save and reactions are links to log in and come back.
  const loginHref = '/login?next=%2Fmedia%2Ffixture-dominion';
  await expect(page.getByRole('link', { name: /^Save/ })).toHaveAttribute('href', loginHref);
  await expect(page.getByRole('link', { name: /this moved me/i })).toHaveAttribute(
    'href',
    loginHref,
  );
  await expect(page.getByRole('link', { name: /i took action/i })).toHaveAttribute(
    'href',
    loginHref,
  );
});

test('/media/[slug] carries JSON-LD Movie and BreadcrumbList and Open Graph video.movie', async ({
  page,
}) => {
  await page.goto('/media/fixture-dominion');
  const data = await jsonLd(page);

  const movie = data.find((entry) => entry['@type'] === 'Movie');
  expect(movie).toBeDefined();
  expect(movie?.name).toBe('Fixture Dominion');
  expect(movie?.duration).toBe('PT2H');
  expect(movie?.about).toEqual([
    { '@type': 'Thing', name: 'ethics' },
    { '@type': 'Thing', name: 'investigation' },
  ]);
  expect(movie?.director).toEqual([{ '@type': 'Person', name: 'Fixture Director' }]);
  expect(movie?.datePublished).toBe('2018-03-29');

  const breadcrumb = data.find((entry) => entry['@type'] === 'BreadcrumbList');
  expect(breadcrumb).toBeDefined();
  const trail = breadcrumb?.itemListElement as Array<{ name: string }>;
  expect(trail.map((crumb) => crumb.name)).toEqual([
    'Vegan Grove',
    'Media library',
    'Fixture Dominion',
  ]);

  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'video.movie');
  await expect(page.locator('meta[property="video:director"]')).toHaveAttribute(
    'content',
    'Fixture Director',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/media\/fixture-dominion$/,
  );
});

test('a bare title still reads well and drops the shelf its API cannot serve', async ({ page }) => {
  const response = await page.goto('/media/fixture-bare-film');
  expect(response?.status()).toBe(200);

  await expect(page.getByTestId('media-kicker')).toContainText('Film / 2017');
  await expect(page.getByTestId('media-poster').getByTestId('poster-fallback')).toBeVisible();
  await expect(page.getByText('No synopsis yet.')).toBeVisible();
  await expect(page.getByText('No public watch link yet.')).toBeVisible();
  await expect(page.getByText('Credits are still being gathered for this title.')).toBeVisible();
  await expect(page.getByRole('button', { name: /load the trailer/i })).toHaveCount(0);
  await expect(page.getByTestId('content-warnings')).toHaveCount(0);
  await expect(page.getByTestId('take-action')).toHaveCount(0);
  // /related answers 501 for this slug in the mock; the page omits the shelf and nothing else.
  await expect(page.getByRole('region', { name: 'Related' })).toHaveCount(0);
  await expect(page.getByTestId('no-hosting-note')).toBeVisible();
});

test('/media/[slug] answers 404 for an unknown slug', async ({ page }) => {
  const response = await page.goto('/media/does-not-exist');
  expect(response?.status()).toBe(404);
});

test('/media/collections/[slug] renders the collection in editorial order', async ({ page }) => {
  const response = await page.goto('/media/collections/fixture-start-here');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Start here');
  await expect(page.getByText('Three titles to begin with.')).toBeVisible();

  const cards = gridCards(page);
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toHaveAttribute('href', '/media/fixture-dominion');
  await expect(cards.nth(1)).toHaveAttribute('href', '/media/fixture-short');
  await expect(cards.nth(2)).toHaveAttribute('href', '/media/fixture-talk');

  const missing = await page.goto('/media/collections/does-not-exist');
  expect(missing?.status()).toBe(404);
});

test('/app/watchlist redirects to /login with a next param when signed out', async ({ page }) => {
  await page.goto('/app/watchlist');
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fwatchlist$/, { timeout: NAV_TIMEOUT });
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/log in/i);
});

test('signed in, /app/watchlist lists the saved titles through the session', async ({
  page,
  context,
  request,
}) => {
  await signIn(context);
  await page.goto('/app/watchlist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Watchlist');
  await expect(page.getByRole('link', { name: /fixture short/i })).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'App' }).getByRole('link', { name: 'Watchlist' }),
  ).toBeVisible();

  const hits = await recorded(request, '/api/me/watchlist');
  expect(hits.length).toBeGreaterThan(0);
  expect(hits.every((hit) => hit.auth)).toBe(true);
});

test('signed in, save and reactions go through the site route with the session', async ({
  page,
  context,
  request,
}) => {
  await signIn(context);
  await page.goto('/media/fixture-dominion');

  const actions = page.getByTestId('media-actions');
  // Buttons, not login links, once there is a session.
  await expect(actions.getByRole('link')).toHaveCount(0);

  const save = actions.getByRole('button', { name: /^Save/ });
  const wasSaved = (await save.getAttribute('aria-pressed')) === 'true';
  const saveCall = page.waitForResponse(
    (res) => res.url().includes('/api/media/00000000000000000000000a/save') && res.ok(),
  );
  await save.click();
  await saveCall;
  await expect(save).toHaveAttribute('aria-pressed', wasSaved ? 'false' : 'true');
  await expect(save).toContainText(wasSaved ? 'Save' : 'Saved');

  const moved = actions.getByRole('button', { name: /this moved me/i });
  const hadMoved = (await moved.getAttribute('aria-pressed')) === 'true';
  await moved.click();
  await expect(moved).toHaveAttribute('aria-pressed', hadMoved ? 'false' : 'true');

  // The mock saw the calls with a bearer token, never without one.
  const saves = await recorded(request, '/api/media/00000000000000000000000a/save');
  expect(saves.length).toBeGreaterThan(0);
  expect(saves.every((hit) => hit.auth)).toBe(true);
  const reactions = (
    await recorded(request, '/api/media/00000000000000000000000a/reactions')
  ).concat(await recorded(request, '/api/media/00000000000000000000000a/reactions/moved'));
  expect(reactions.length).toBeGreaterThan(0);
  expect(reactions.every((hit) => hit.auth)).toBe(true);

  // Reload: the server-rendered state matches what the API now says.
  await page.reload();
  await expect(actions.getByRole('button', { name: /^Save/ })).toHaveAttribute(
    'aria-pressed',
    wasSaved ? 'false' : 'true',
  );
});

test('the site routes refuse save and reactions without a session', async ({ request }) => {
  const save = await request.post('/api/media/00000000000000000000000a/save');
  expect(save.status()).toBe(401);
  const react = await request.post('/api/media/00000000000000000000000a/reactions', {
    data: { type: 'moved' },
  });
  expect(react.status()).toBe(401);
  const bad = await request.post('/api/media/00000000000000000000000a/reactions', {
    data: { type: 'nope' },
    headers: { Cookie: 'vg_session=fixture-session' },
  });
  expect(bad.status()).toBe(400);
});

test('sitemap.xml and llms.txt list published titles and collections', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/media/fixture-dominion</loc>');
  expect(sitemap).toContain('/media/fixture-catalog-30</loc>');
  expect(sitemap).toContain('/media/collections/fixture-start-here</loc>');

  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).toContain('## Media library');
  expect(llms).toMatch(
    /\[Fixture Dominion\]\(.*\/media\/fixture-dominion\): Documentary, 2018, free to watch/,
  );
  expect(llms).toMatch(/\[Start here\]\(.*\/media\/collections\/fixture-start-here\)/);
});
