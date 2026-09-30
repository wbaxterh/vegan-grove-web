import { expect, test } from '@playwright/test';

/**
 * Runs in its own Playwright project before everything else (see playwright.config.ts): it
 * switches the mock's /api/media/home off, and because Next caches only 200 responses the
 * fallback must be observed before another test warms that fetch. The config also starts the
 * dev server with an empty data cache, so a previous run cannot serve that 200 stale.
 */

const MOCK_URL = `http://127.0.0.1:${process.env.MOCK_API_PORT ?? '4010'}`;

test('/media falls back to the plain grid when /api/media/home is not there yet', async ({
  page,
  request,
}) => {
  const switched = await request.post(`${MOCK_URL}/__mock/media-home`, { data: { status: 501 } });
  expect(switched.ok()).toBe(true);
  try {
    const response = await page.goto('/media');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Media library');
    await expect(page.getByTestId('media-hero')).toHaveCount(0);
    await expect(page.getByTestId('media-shelf')).toHaveCount(0);
    // The grid still comes from /api/media, with its filters and paging intact.
    await expect(page.getByTestId('media-grid').getByTestId('poster-card')).toHaveCount(24);
    await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Search the library' })).toBeVisible();
  } finally {
    const restored = await request.delete(`${MOCK_URL}/__mock/media-home`);
    expect(restored.ok()).toBe(true);
  }
});

/**
 * Warm-up, not a test of behaviour: the map tests run in parallel right after this project,
 * and the first request to a route in dev mode pays its compile. Paying it here, alone, keeps
 * the marker timeout in smoke.spec.ts about the map and not about the compiler.
 */
test('warms the places route so the parallel map tests start from a compiled page', async ({
  page,
}) => {
  await page.goto('/places');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.maplibregl-map')).toBeVisible({ timeout: 60_000 });
});
