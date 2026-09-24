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
