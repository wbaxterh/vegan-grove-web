import { defineConfig, devices } from '@playwright/test';

/** Override with PLAYWRIGHT_PORT when something else already owns 3000 on your machine. */
const port = process.env.PLAYWRIGHT_PORT ?? '3000';
const mockApiPort = process.env.MOCK_API_PORT ?? '4010';
const baseURL = `http://127.0.0.1:${port}`;

/**
 * Two servers: a mock of vegan-grove-api serving fixtures in the API's real
 * response shapes (tests/fixtures/mock-api.mjs), and the Next dev server
 * pointed at it. Server components fetch from the mock, so the contract the
 * pages read is exercised end to end, not just in the browser.
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
      url: `http://127.0.0.1:${mockApiPort}/healthz`,
      env: { MOCK_API_PORT: mockApiPort },
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
      url: `${baseURL}/`,
      env: { NEXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${mockApiPort}/api` },
      // Never reuse: a dev server started by hand points at a different API.
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
