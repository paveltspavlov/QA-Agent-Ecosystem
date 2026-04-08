import { test as setup, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_FILE = path.join(__dirname, '../.auth/state.json');
const AUTH_DIR = path.dirname(AUTH_FILE);

/**
 * Global authentication setup — runs once per test session.
 *
 * This script is executed in the "setup" project before all UI tests run.
 * It logs in with test credentials and caches the auth state in `.auth/state.json`.
 *
 * Subsequent tests reference this cached state via `storageState` config.
 *
 * Note: demoqa.com doesn't have real authentication, but we set up the pattern
 * for production applications that do require login.
 */
setup.describe('Global Setup', () => {
  setup('authenticate and cache auth state', async () => {
    // Ensure .auth directory exists
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    // Use actual test credentials from environment or hardcoded defaults
    // demoqa.com doesn't enforce auth, so any credentials work for pattern testing
    const username = process.env.TEST_USER_EMAIL || 'testuser';
    const password = process.env.TEST_USER_PASSWORD || 'Test@1234';

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Navigate to demoqa.com
      console.log(`[Setup] Navigating to https://demoqa.com`);
      await page.goto('https://demoqa.com', { waitUntil: 'domcontentloaded' });

      // Verify homepage loaded
      await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
      console.log('[Setup] Homepage loaded successfully');

      // Note: demoqa.com doesn't require login for most tests, but test the pattern anyway
      // Verify main navigation is present (indicates page is fully loaded)
      const mainNav = page.locator('[id="app"]');
      await expect(mainNav).toBeVisible();

      // Save auth state (in real app, this would save cookies/tokens after actual login)
      await context.storageState({ path: AUTH_FILE });
      console.log(`[Setup] Auth state saved to ${AUTH_FILE}`);

      // Log success
      console.log('[Setup] ✓ Authentication setup complete');
    } catch (error) {
      console.error('[Setup] Authentication failed:', error);
      throw new Error(`Setup authentication failed: ${(error as Error).message}`);
    } finally {
      await browser.close();
    }
  });

  /**
   * Validate auth state is readable (sanity check).
   * This runs after the main setup to ensure the cache was written successfully.
   */
  setup('verify auth state file exists', async () => {
    if (!fs.existsSync(AUTH_FILE)) {
      throw new Error(`Auth state file not found at ${AUTH_FILE}`);
    }

    try {
      const data = fs.readFileSync(AUTH_FILE, 'utf8');
      const state = JSON.parse(data);

      // Ensure state has expected structure (cookies/localStorage)
      if (!state.cookies && !state.localStorage) {
        console.warn('[Setup] Auth state is empty (expected for demoqa.com without real login)');
      }

      console.log('[Setup] ✓ Auth state file validation complete');
    } catch (error) {
      throw new Error(`Failed to validate auth state: ${(error as Error).message}`);
    }
  });
});

