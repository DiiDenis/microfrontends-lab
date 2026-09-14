import { defineConfig } from '@playwright/test';

const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'pnpm run dev:shell',
      name: 'shell',
      reuseExistingServer,
      timeout: 120_000,
      url: 'http://localhost:3000',
    },
    {
      command: 'pnpm run dev:products',
      name: 'products',
      reuseExistingServer,
      timeout: 120_000,
      url: 'http://localhost:3001/mf-manifest.json',
    },
    {
      command: 'pnpm run dev:account',
      name: 'account',
      reuseExistingServer,
      timeout: 120_000,
      url: 'http://localhost:3002/mf-manifest.json',
    },
  ],
});
