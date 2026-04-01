import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: CI ? 'github' : [['html'], ['json', { outputFile: 'test-results.json' }]],
  timeout: Number(process.env.TEST_TIMEOUT) || 30_000,

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Auth setup — runs before all UI tests
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/state.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: '.auth/state.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: '.auth/state.json',
      },
      dependencies: ['setup'],
    },

    // API tests — no browser needed
    {
      name: 'api',
      testMatch: /.*\/api\/.*\.spec\.ts/,
      use: { baseURL: process.env.API_BASE_URL || `${BASE_URL}/api` },
    },
  ],
});
