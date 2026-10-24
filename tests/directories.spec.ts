import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial', timeout: 60_000 });

const MOCK_URL = `http://127.0.0.1:${process.env.MOCK_API_PORT ?? '4010'}`;

test('/creators lists people alphabetically, with shelves and initials', async ({ page }) => {
  const response = await page.goto('/creators');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Creators');
  await expect(page.locator('img')).toHaveCount(0);

  const cooking = page.getByRole('region', { name: 'Start here for cooking' });
  await expect(cooking.getByRole('link', { name: 'Ava Cooks' })).toBeVisible();
  await expect(cooking.getByRole('link', { name: 'Ed Winters' })).toHaveCount(0);

  const directory = page.getByRole('region', { name: 'Directory' });
  await expect(directory.getByRole('link', { name: 'Ava Cooks' })).toBeVisible();
  await expect(directory.getByRole('link', { name: 'Ed Winters' })).toBeVisible();
  const names = directory.getByRole('link', { name: /Cooks|Winters/ });
  await expect(names.nth(0)).toHaveText('Ava Cooks');
  await expect(names.nth(1)).toHaveText('Ed Winters');
  await expect(directory.getByTestId('initials-avatar').nth(0)).toHaveText('AC');
  await expect(directory.getByTestId('initials-avatar').nth(1)).toHaveText('EW');

  const text = (await page.locator('body').innerText()).toLowerCase();
  expect(text).not.toMatch(/\btop\b/);
  expect(text).not.toMatch(/follower/);
});

test('a topic filter narrows the directory and hides the shelves', async ({ page }) => {
  await page.goto('/creators?topic=cooking');
  await expect(page.getByRole('heading', { name: 'Start here for cooking' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ava Cooks' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ed Winters' })).toHaveCount(0);
});

test('search matches a name the creator also uses', async ({ page }) => {
  await page.goto('/creators?q=earthling');
  await expect(page.getByRole('link', { name: 'Ed Winters' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ava Cooks' })).toHaveCount(0);
});

test('/creators/[slug] links out and offers the takedown form', async ({ page }) => {
  const response = await page.goto('/creators/ed-winters');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ed Winters');
  await expect(page.getByTestId('initials-avatar')).toHaveText('EW');
  await expect(page.locator('img')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'YouTube' })).toHaveAttribute(
    'href',
    'https://www.youtube.com/channel/UCVRrGAcUc7cblUzOhI1KfFg',
  );
  await expect(page.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
    'href',
    'https://www.instagram.com/earthlinged/',
  );
  const youtube = page.getByRole('link', { name: 'YouTube' });
  await expect(youtube).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.getByRole('link', { name: 'Is this you?' })).toHaveAttribute(
    'href',
    '/creators/ed-winters/takedown',
  );
  const text = (await page.locator('body').innerText()).toLowerCase();
  expect(text).not.toMatch(/\btop\b/);
  expect(text).not.toMatch(/follower/);
});

test('a retired creator answers 410', async ({ page }) => {
  const response = await page.goto('/creators/retired-creator');
  expect(response?.status()).toBe(410);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('This page is gone');
  await expect(page.locator('img')).toHaveCount(0);
});

test('an unknown creator answers 404', async ({ page }) => {
  const response = await page.goto('/creators/does-not-exist');
  expect(response?.status()).toBe(404);
});

test('the takedown form has no name or email and does not send the request', async ({
  page,
  request,
}) => {
  await page.goto('/creators/ed-winters/takedown');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Is this you?');
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(page.locator('input[name="name"]')).toHaveCount(0);
  await page.getByLabel('Request').fill('Please remove this page.');
  await page.getByLabel('Link to your site or channel').fill('https://earthlinged.org/');
  await page.getByRole('button', { name: 'Submit the request' }).click();
  await expect(page.getByRole('status')).toContainText('nothing was sent');

  const logged = await request.get(`${MOCK_URL}/__mock/requests`);
  const posts = (await logged.json()).items.filter(
    (entry: { method: string; path: string }) =>
      entry.method === 'POST' && entry.path.includes('creator'),
  );
  expect(posts).toEqual([]);
});

test('/organizations lists hosts and a page links out', async ({ page }) => {
  await page.goto('/organizations');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Who hosts the work');
  await expect(page.getByRole('link', { name: 'Harbor Animal Save' })).toBeVisible();
  await expect(page.getByText('Verified', { exact: true })).toBeVisible();
  const text = (await page.locator('body').innerText()).toLowerCase();
  expect(text).not.toMatch(/\btop\b/);

  await page.getByRole('link', { name: 'Sanctuary', exact: true }).click();
  await expect(page).toHaveURL(/type=sanctuary/);
  await expect(page.getByRole('link', { name: 'Fixture Sanctuary Org' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Harbor Animal Save' })).toHaveCount(0);

  await page.goto('/organizations/harbor-animal-save');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Harbor Animal Save');
  await expect(page.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
    'href',
    'https://www.instagram.com/harboranimalsave/',
  );
  await expect(page.locator('img')).toHaveCount(0);
});

test('area and city pages list the approved places', async ({ page }) => {
  await page.goto('/areas');
  await expect(page.getByRole('link', { name: 'Long Beach' })).toHaveAttribute(
    'href',
    '/areas/long_beach',
  );

  await page.goto('/areas/long_beach');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Long Beach');
  await expect(page.getByRole('link', { name: /Fixture Sanctuary/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Fixture Community Garden/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Fixture Chain Cafe/ })).toBeVisible();
  await expect(page.getByText('Vegan options', { exact: true })).toBeVisible();
  await expect(page.getByText('Fully vegan', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Long Beach', exact: true })).toHaveAttribute(
    'href',
    '/areas/long_beach/long-beach',
  );

  await page.goto('/areas/long_beach/long-beach');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Long Beach');
  await expect(page.getByRole('link', { name: /Fixture Sanctuary/ })).toBeVisible();

  await page.goto('/areas/orange_county');
  await expect(page.getByText('No approved places in Orange County yet')).toBeVisible();

  const missingArea = await page.goto('/areas/not-a-region');
  expect(missingArea?.status()).toBe(404);
  const missingCity = await page.goto('/areas/long_beach/no-such-city');
  expect(missingCity?.status()).toBe(404);
});

test('a place page links to its area and city', async ({ page }) => {
  await page.goto('/places/fixture-sanctuary');
  await expect(page.locator('a[href="/areas/long_beach"]')).toBeVisible();
  await expect(page.locator('a[href="/areas/long_beach/long-beach"]')).toBeVisible();
});

test('sitemap and llms.txt include the directories', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const path of [
    '/creators',
    '/creators/ava-cooks',
    '/creators/ed-winters',
    '/organizations',
    '/organizations/harbor-animal-save',
    '/areas',
    '/areas/long_beach',
    '/areas/long_beach/long-beach',
  ]) {
    expect(xml).toContain(path);
  }
  expect(xml).not.toContain('retired-creator');

  const llms = await request.get('/llms.txt');
  expect(llms.status()).toBe(200);
  const text = await llms.text();
  expect(text).toContain('/creators/ed-winters');
  expect(text).toContain('Harbor Animal Save');
  expect(text).toContain('/areas/long_beach/long-beach');
  expect(text.toLowerCase()).not.toMatch(/\btop\b/);
});
