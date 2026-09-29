import { expect, test } from '@playwright/test';

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

test('/places renders a marker from the mock API', async ({ page }) => {
  // The mock API serves { items: [...] } with location as { lng, lat }, the API's real shape.
  await page.goto('/places');
  await expect(page.locator('.maplibregl-marker')).toHaveCount(1, { timeout: 20_000 });
  await expect(page.getByRole('link', { name: /fixture sanctuary/i })).toBeVisible();
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
