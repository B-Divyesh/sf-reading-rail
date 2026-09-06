import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/claims',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: 'npm run preview:site',
    url: 'http://127.0.0.1:4173/',
    timeout: 120_000,
    reuseExistingServer: false,
    env: { HOST: '0.0.0.0', PORT: '4173' },
  },
});
