import { defineConfig, devices } from '@playwright/test';

// On TrueNAS штаб /home is mounted noexec, so locally-cached chromium can't run.
// Use external chrome-cdp container at 127.0.0.1:9222 instead.
const useCdp = process.env.PLAYWRIGHT_USE_CDP === '1';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3200',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    ...(useCdp
      ? { connectOptions: { wsEndpoint: 'ws://127.0.0.1:9222' } }
      : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: useCdp ? {} : { ...devices['Desktop Chrome'] },
    },
  ],
});
