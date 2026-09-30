import { defineConfig, devices } from '@playwright/test';

/** Override with PLAYWRIGHT_PORT when something else already owns 3000 on your machine. */
const port = process.env.PLAYWRIGHT_PORT ?? '3000';
const mockApiPort = process.env.MOCK_API_PORT ?? '4010';
const baseURL = `http://127.0.0.1:${port}`;
const mockApiOrigin = `http://127.0.0.1:${mockApiPort}`;
const CLEAR_FETCH_CACHE = `node -e "require('node:fs').rmSync('.next/cache/fetch-cache', { recursive: true, force: true })"`;

/**
 * Two servers: a mock of vegan-grove-api serving fixtures in the API's real
 * response shapes (tests/fixtures/mock-api.mjs), and the Next dev server
 * pointed at it. Server components fetch from the mock, so the contract the
 * pages read is exercised end to end, not just in the browser. The mock also
 * serves the fixture poster images, so it doubles as the media CDN origin.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: `node tests/fixtures/mock-api.mjs`,
      url: `${mockApiOrigin}/healthz`,
      env: { MOCK_API_PORT: mockApiPort },
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      // The dev server persists its data cache under .next/cache and serves a stale entry
      // while revalidating, so a previous run's /api/media/home would outlive the mock's
      // 501 switch. Every run starts with that cache empty.
      command: `${CLEAR_FETCH_CACHE} && npm run dev -- --hostname 127.0.0.1 --port ${port}`,
      url: `${baseURL}/`,
      env: {
        NEXT_PUBLIC_API_BASE_URL: `${mockApiOrigin}/api`,
        NEXT_PUBLIC_MEDIA_CDN_ORIGIN: mockApiOrigin,
      },
      // Never reuse: a dev server started by hand points at a different API.
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      // Runs first and alone: it switches the mock's /media/home off, and Next only caches
      // 200s, so the fallback has to be observed before any later test warms that fetch.
      name: 'degraded',
      testMatch: /media-degraded\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      testIgnore: /media.*\.spec\.ts/,
      dependencies: ['degraded'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // One test at a time: the library page is ~100 poster cards, and the dev server's RSC
      // payload carries React's debug info for every one of them (owner stacks, props), so a
      // dev render costs seconds and eight of them at once take a minute. Production strips
      // all of that; this only keeps the suite honest about it.
      name: 'media',
      testMatch: /media\.spec\.ts/,
      fullyParallel: false,
      // After the map tests, not alongside them: two projects on one dev server starve each other.
      dependencies: ['chromium'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
