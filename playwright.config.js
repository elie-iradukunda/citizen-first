import { defineConfig } from '@playwright/test';

// E2E tests drive the real Google Chrome (channel: 'chrome') against the
// running dev servers (client :5173 proxying /api -> server :4000).
// Start them first:  DB_DISABLED=true npm run dev:server   and   npm run dev:client
export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    channel: 'chrome',
    headless: process.env.HEADED ? false : true,
    viewport: { width: 1366, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    launchOptions: { slowMo: process.env.HEADED ? 550 : 0 },
  },
});
