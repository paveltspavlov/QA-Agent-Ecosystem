import { test as base, expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { HomePage } from '../pages/home.page';
import { ResourceCleanupTracker, PageStateManager, createTestContext, type TestContext } from '../helpers/test-lifecycle';

/**
 * Enhanced Test Fixtures with Full Lifecycle Management
 *
 * This fixture suite provides:
 * - Page object instances (LoginPage, HomePage, etc.)
 * - Resource cleanup tracking for tests that create data
 * - Page state management utilities
 * - Auth validation helpers
 * - Automatic cleanup via afterEach hooks
 *
 * Usage:
 *   import { test, expect } from '../fixtures/enhanced.fixture';
 *
 *   test('example test', async ({ loginPage, homePage, trackResource }) => {
 *     // Use fixtures
 *     await loginPage.goto();
 *     await trackResource('user', 'user-123');  // Register for cleanup
 *   });
 */

type EnhancedQAFixtures = {
  // ========================================================================
  // PAGE OBJECTS
  // ========================================================================

  /** LoginPage for authentication flows */
  loginPage: LoginPage;

  /** HomePage for dashboard/home navigation */
  homePage: HomePage;

  // ========================================================================
  // TEST CONTEXT & STATE MANAGEMENT
  // ========================================================================

  /** Full test context (run ID, start time, cleanup tracker, page state) */
  testContext: TestContext;

  /** Resource cleanup tracker for registering created resources */
  cleanupTracker: ResourceCleanupTracker;

  /** Page state manager for navigation and browser storage utilities */
  pageState: PageStateManager;

  // ========================================================================
  // RESOURCE TRACKING
  // ========================================================================

  /** Register a resource ID for cleanup */
  trackResource: (type: string, id: string) => void;

  /** Get all tracked resources for current test */
  getTrackedResources: () => Record<string, string[]>;

  /** Clear tracked resources (useful for multi-part tests) */
  clearTrackedResources: () => void;

  // ========================================================================
  // CLEANUP UTILITIES
  // ========================================================================

  /** Cleanup function (runs automatically in afterEach) */
  cleanup: () => Promise<void>;

  /** Check if page state is valid/clean */
  assertPageIsClean: () => Promise<void>;

  // ========================================================================
  // AUTH VALIDATION
  // ========================================================================

  /** Verify cached auth state is still valid (if real auth exists) */
  validateAuth: () => Promise<boolean>;
};

export const test = base.extend<EnhancedQAFixtures>({
  // ========================================================================
  // TEST CONTEXT (created once per test)
  // ========================================================================
  testContext: async ({ page }, use) => {
    const context = createTestContext(page);
    console.log(`[Test] Starting test with run ID: ${context.runId}`);
    await use(context);
  },

  // ========================================================================
  // PAGE OBJECTS
  // ========================================================================
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  // ========================================================================
  // RESOURCE CLEANUP TRACKER
  // ========================================================================
  cleanupTracker: async ({ testContext }, use) => {
    await use(testContext.cleanupTracker);
  },

  // ========================================================================
  // PAGE STATE MANAGER
  // ========================================================================
  pageState: async ({ testContext }, use) => {
    await use(testContext.pageState);
  },

  // ========================================================================
  // RESOURCE TRACKING HELPERS
  // ========================================================================
  trackResource: async ({ cleanupTracker }, use) => {
    await use((type: string, id: string) => {
      console.log(`[Resource] Tracking ${type}: ${id}`);
      cleanupTracker.track(type, id);
    });
  },

  getTrackedResources: async ({ cleanupTracker }, use) => {
    await use(() => cleanupTracker.getAllTracked());
  },

  clearTrackedResources: async ({ cleanupTracker }, use) => {
    await use(() => {
      console.log(`[Cleanup] Clearing tracked resources`);
      cleanupTracker.clear();
    });
  },

  // ========================================================================
  // CLEANUP FIXTURE (runs after each test)
  // ========================================================================
  cleanup: async ({ page, testContext }, use) => {
    await use(async () => {
      await test.step('Test cleanup', async (step) => {
        const totalResources = testContext.cleanupTracker.total;

        if (totalResources > 0) {
          const tracked = testContext.cleanupTracker.getAllTracked();
          await step.attach('tracked-resources', {
            body: JSON.stringify(tracked, null, 2),
            contentType: 'application/json',
          });
        }

        try {
          await page.goto('/', { waitUntil: 'domcontentloaded' });
        } catch (error) {
          console.warn(`[Cleanup] Navigation error: ${(error as Error).message}`);
        }

        try {
          await testContext.pageState.clearBrowserStorage();
        } catch (error) {
          console.warn(`[Cleanup] Storage clear error: ${(error as Error).message}`);
        }
      });
    });
  },

  // ========================================================================
  // PAGE STATE ASSERTIONS
  // ========================================================================
  assertPageIsClean: async ({ page }, use) => {
    await use(async () => {
      const body = page.locator('body');
      if (!(await body.isVisible())) {
        throw new Error('Page body not visible - page may not be ready');
      }
      console.log(`[Assert] Page is clean and ready`);
    });
  },

  // ========================================================================
  // AUTH VALIDATION
  // ========================================================================
  validateAuth: async ({ page }, use) => {
    await use(async () => {
      // For demoqa.com without real auth, always return true
      // In a production app, this would check token expiry, session validity, etc.
      try {
        // Could check for presence of auth token/cookie here
        return true;
      } catch {
        return false;
      }
    });
  },
});

// ============================================================================
// HOOK SETUP FOR AUTOMATIC CLEANUP
// ============================================================================

/**
 * Register afterEach hook to ensure cleanup runs after every test.
 * This is called when test file is imported.
 */
test.afterEach(async ({ cleanup, testContext }, testInfo) => {
  console.log(`[afterEach] Running cleanup for test: ${testInfo.title}`);
  await cleanup();

  const duration = testInfo.duration;
  console.log(`[afterEach] Test completed in ${duration}ms`);
});

/**
 * Optional: Log test start/end for observability.
 */
test.beforeEach(async ({ testContext }, testInfo) => {
  console.log(`[beforeEach] Starting test: ${testInfo.title}`);
  console.log(`[beforeEach] Run ID: ${testContext.runId}`);
});

export { expect };
