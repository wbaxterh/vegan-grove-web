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

test('/places renders a marker from a place in the API response shape', async ({ page }) => {
  // The API serializes location as { lng, lat }; this fixture is the contract the map renders.
  await page.route('**/api/places?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        items: [
          {
            id: '000000000000000000000001',
            name: 'Fixture Sanctuary',
            slug: 'fixture-sanctuary',
            type: 'sanctuary',
            veganLevel: 'full',
            location: { lng: -118.19, lat: 33.83 },
            address: '1 Fixture Way',
            city: 'Long Beach',
            area: 'long_beach',
            tags: [],
            description: '',
            photoKeys: [],
            ratingAvg: 0,
            reviewCount: 0,
          },
        ],
        nextCursor: null,
      }),
    }),
  );
  await page.goto('/places');
  await expect(page.locator('.maplibregl-marker')).toHaveCount(1, { timeout: 20_000 });
  await expect(page.getByRole('link', { name: /fixture sanctuary/i })).toBeVisible();
});
