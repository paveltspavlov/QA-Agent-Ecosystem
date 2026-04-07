import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';

config();

const BASE_URL = process.env.BASE_URL || 'https://demoqa.com';
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  // Global setup and teardown for shared resources (disable for accessibility audit)
  // globalSetup: path.join(__dirname, 'auth/auth.setup.ts'),

  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: CI ? [['github'], ['json', { outputFile: 'test-results.json' }]] : [['html'], ['json', { outputFile: 'test-results.json' }]],
  timeout: Number(process.env.TEST_TIMEOUT) || 60_000,

  // Playwright 1.59 features
  failOnFlakyTests: CI,

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'on-first-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },

  projects: [
    // UI Tests — desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    // Mobile viewport tests
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],

  // webServer not needed - testing external site (demoqa.com)
});
