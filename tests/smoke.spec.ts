import { expect, type Page, test } from '@playwright/test';

/** Pins land once the style loads and the first `map-pins` request answers. */
const MAP_TIMEOUT = 20_000;

const markers = (page: Page) => page.locator('.maplibregl-marker button');
/** A pin by accessible name, scoped to the map so the matching list row does not collide. */
const marker = (page: Page, name: RegExp) =>
  page.locator('.maplibregl-marker').getByRole('button', { name });
const chip = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const listOf = (page: Page) => page.getByRole('region', { name: 'Places on the map' });

test('home renders the product name', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/vegan grove/i);
});

test('/places renders the map container', async ({ page }) => {
  await page.goto('/places');
  await expect(page.getByTestId('places-map')).toBeVisible();
});

test('/app/feed redirects to /login with a next param', async ({ page }) => {
  await page.goto('/app/feed');
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Ffeed$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/log in/i);
});

test('security headers are present', async ({ request }) => {
  const response = await request.get('/');
  const headers = response.headers();
  expect(headers['content-security-policy']).toContain("default-src 'self'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
});

test('/places renders markers from the mock API', async ({ page }) => {
  // The mock API serves { items: [...] } with location as { lng, lat }, the API's real shape.
  await page.goto('/places');
  await expect(markers(page)).toHaveCount(2, { timeout: MAP_TIMEOUT });
  await expect(marker(page, /fixture sanctuary/i)).toBeVisible();
});

test('/places/[slug] renders a place from the single-resource envelope', async ({ page }) => {
  // Server component fetch: the mock answers { place: {...} } and the page must unwrap it.
  const response = await page.goto('/places/fixture-sanctuary');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Fixture Sanctuary');
  await expect(page.getByText('No reviews yet.')).toBeVisible();
});

test('/places/[slug] answers 404 for an unknown slug', async ({ page }) => {
  const response = await page.goto('/places/does-not-exist');
  expect(response?.status()).toBe(404);
});

test('default view shows only fully vegan, non-chain pins', async ({ page }) => {
  await page.goto('/places');
  await expect(markers(page)).toHaveCount(2, { timeout: MAP_TIMEOUT });
  await expect(marker(page, /fixture sanctuary/i)).toBeVisible();
  await expect(marker(page, /fixture community garden/i)).toBeVisible();
  await expect(marker(page, /fixture chain cafe/i)).toHaveCount(0);

  // The side list mirrors the pins and marks the garden's type.
  const list = listOf(page);
  await expect(list.getByRole('button', { name: /fixture community garden/i })).toBeVisible();
  await expect(list.getByText('Garden', { exact: true })).toBeVisible();
});

test('vegan options and chains are opt-in and land in the URL', async ({ page }) => {
  await page.goto('/places');
  await expect(markers(page)).toHaveCount(2, { timeout: MAP_TIMEOUT });

  // The chain cafe has vegan options, so the level alone does not reveal it.
  await chip(page, 'Vegan options').click();
  await expect(page).toHaveURL(/\?level=all$/);
  await expect(chip(page, 'Vegan options')).toHaveAttribute('aria-pressed', 'true');
  await expect(markers(page)).toHaveCount(2);

  await chip(page, 'Show chains').click();
  await expect(page).toHaveURL(/\?level=all&chains=1$/);
  await expect(markers(page)).toHaveCount(3, { timeout: MAP_TIMEOUT });
  await expect(marker(page, /fixture chain cafe/i)).toBeVisible();

  const list = listOf(page);
  await expect(list.getByText('Chain', { exact: true })).toBeVisible();
  // Eateries keep their level badge; sanctuaries and gardens never show one.
  await expect(list.getByText('Vegan options', { exact: true })).toBeVisible();
  await expect(list.getByText('Fully vegan', { exact: true })).toHaveCount(0);
});

test('clicking a marker opens a popup with the place', async ({ page }) => {
  await page.goto('/places');
  await expect(markers(page)).toHaveCount(2, { timeout: MAP_TIMEOUT });

  await marker(page, /fixture sanctuary/i).click();
  const popup = page.getByTestId('place-popup');
  await expect(popup).toBeVisible();
  await expect(popup).toContainText('Fixture Sanctuary');
  // Sanctuaries and gardens are not restaurants, so no vegan-level badge.
  await expect(popup).not.toContainText('Fully vegan');
  await expect(popup).toContainText('1 Fixture Way');
  await expect(popup).toContainText('Sa-Su 10:00-16:00');
  await expect(popup.getByRole('link', { name: 'View place' })).toHaveAttribute(
    'href',
    '/places/fixture-sanctuary',
  );

  // The matching row is highlighted, and Escape closes the popup.
  const list = listOf(page);
  await expect(list.getByRole('button', { name: /fixture sanctuary/i })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0);
});

test('a list row flies to the place and opens its popup', async ({ page }) => {
  await page.goto('/places');
  await expect(markers(page)).toHaveCount(2, { timeout: MAP_TIMEOUT });

  const list = listOf(page);
  await list.getByRole('button', { name: /fixture community garden/i }).click();
  const popup = page.getByTestId('place-popup');
  await expect(popup).toContainText('Fixture Community Garden');
  await expect(popup).toContainText('Garden');
});

test('/places/[slug] shows phone, hours, postcode, and a map preview', async ({ page }) => {
  await page.goto('/places/fixture-sanctuary');
  await expect(page.getByRole('link', { name: '+1 562 555 0100' })).toHaveAttribute(
    'href',
    'tel:+15625550100',
  );
  await expect(page.getByText('Sa-Su 10:00-16:00', { exact: true })).toBeVisible();
  await expect(page.getByText('Mo-Fr by appointment', { exact: true })).toBeVisible();
  await expect(page.getByText('Long Beach 90802')).toBeVisible();
  await expect(page.getByTestId('place-mini-map')).toBeVisible();
  await expect(page.getByText(/homes for rescued animals/)).toBeVisible();
});

test('/places/[slug] keeps the ODbL attribution for OSM places', async ({ page }) => {
  await page.goto('/places/fixture-community-garden');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Fixture Community Garden');
  await expect(page.getByText(/, ODbL\./)).toBeVisible();
  await expect(page.getByText('osm', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/grow food without animals/)).toBeVisible();
});

test('filter params round-trip through the URL and the API request', async ({ page }) => {
  const pinsRequest = page.waitForRequest(
    (request) =>
      request.url().includes('/api/places/map-pins?') &&
      request.url().includes('veganLevel=all') &&
      request.url().includes('types=sanctuary%2Cgarden') &&
      request.url().includes('includeChains=true'),
  );
  await page.goto('/places?level=all&types=sanctuary,garden&chains=1');
  await pinsRequest;

  await expect(chip(page, 'Fully vegan')).toHaveAttribute('aria-pressed', 'true');
  await expect(chip(page, 'Vegan options')).toHaveAttribute('aria-pressed', 'true');
  await expect(chip(page, 'Show chains')).toHaveAttribute('aria-pressed', 'true');
  await expect(chip(page, 'Sanctuary')).toHaveAttribute('aria-pressed', 'true');
  await expect(chip(page, 'Garden')).toHaveAttribute('aria-pressed', 'true');
  await expect(chip(page, 'Cafe')).toHaveAttribute('aria-pressed', 'false');
  // The cafe is filtered out by type even though options and chains are on.
  await expect(markers(page)).toHaveCount(2, { timeout: MAP_TIMEOUT });

  // Turning a type back on rewrites the query without a navigation.
  await chip(page, 'Cafe').click();
  await expect(page).toHaveURL(/\?level=all&types=sanctuary%2Cgarden%2Ccafe&chains=1$/);
  await expect(markers(page)).toHaveCount(3, { timeout: MAP_TIMEOUT });
});
