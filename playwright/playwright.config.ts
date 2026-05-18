import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';

config();

const BASE_URL = process.env.BASE_URL || 'https://example.com';
const CI = !!process.env.CI;

// When qa-agent launches Playwright (or any caller sets PW_OUTPUT_BASE), route
// all artifacts into that base dir so they land under the active session
// (outputs/<project>/<timestamp>/playwright/). Falls back to ./test-results
// and ./playwright-report when unset, matching prior behavior.
const PW_OUTPUT_BASE = process.env.PW_OUTPUT_BASE || '.';
const OUTPUT_DIR = path.join(PW_OUTPUT_BASE, 'test-results');
const HTML_REPORT_DIR = path.join(PW_OUTPUT_BASE, 'playwright-report');
const JSON_REPORT_FILE = path.join(PW_OUTPUT_BASE, 'test-results.json');

export default defineConfig({
  // Scaffold-only default. `qa-agent playwright-gen` writes a per-session
  // playwright.config.ts under outputs/{app}/{timestamp}/playwright-tests/
  // that overrides testDir. Run with `qa-agent playwright-run --app <name>`.
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  outputDir: OUTPUT_DIR,
  // Global setup and teardown for shared resources (disable for accessibility audit)
  // globalSetup: path.join(__dirname, 'auth/auth.setup.ts'),

  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: CI
    ? [['github'], ['json', { outputFile: JSON_REPORT_FILE }]]
    : [['html', { outputFolder: HTML_REPORT_DIR, open: 'never' }], ['json', { outputFile: JSON_REPORT_FILE }]],
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

  // webServer not configured by default — set it for tests that target a local app.
});
