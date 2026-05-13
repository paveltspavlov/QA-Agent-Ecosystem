/**
 * Generic test fixtures — extend Playwright's base `test` with app-specific
 * page objects and helpers in your generated session.
 *
 * Generated tests can either import directly from `@playwright/test` or extend
 * this fixture in their own per-session fixture file.
 */
import { test as base, expect } from '@playwright/test';

type ScaffoldFixtures = {
  /** Placeholder — replace with your app's fixtures. */
  _scaffold: void;
};

export const test = base.extend<ScaffoldFixtures>({
  _scaffold: async ({}, use) => {
    await use();
  },
});

export { expect };
