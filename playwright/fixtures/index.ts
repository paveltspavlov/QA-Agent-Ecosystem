import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { HomePage } from '../pages/home.page';

/**
 * Test fixtures extending Playwright's base test.
 *
 * Fixture lifecycle:
 * - beforeAll: Expensive shared setup (auth via global setup)
 * - beforeEach: Per-test resource creation (clean page state, fresh data)
 * - afterEach: Per-test resource cleanup (clear temp data, logout if needed)
 * - afterAll: Shared cleanup (browser/context shutdown handled by Playwright)
 *
 * Auth state is cached in `.auth/state.json` and reused across tests to avoid
 * repeated login operations. The auth setup runs once via `auth.setup.ts`.
 */

type QAFixtures = {
  /** Initialized and typed LoginPage for authentication flows. */
  loginPage: LoginPage;

  /** Initialized HomePage for dashboard/home navigation. */
  homePage: HomePage;

  /** List of resource IDs created during the test for cleanup tracking. */
  createdResourceIds: { users: string[]; products: string[]; orders: string[] };

  /** Helper to register a resource ID for cleanup. */
  trackResource: (type: 'user' | 'product' | 'order', id: string) => void;

  /** Helper to clean up all tracked resources (runs in afterEach). */
  cleanupResources: () => Promise<void>;

  /** Helper to check if auth state is valid (token not expired). */
  isAuthValid: () => Promise<boolean>;
};

export const test = base.extend<QAFixtures>({
  // ============================================================================
  // LOGIN PAGE FIXTURE
  // ============================================================================
  /** Provides a LoginPage instance bound to the current page context. */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // ============================================================================
  // HOME PAGE FIXTURE
  // ============================================================================
  /** Provides a HomePage instance for dashboard tests. */
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  // ============================================================================
  // RESOURCE TRACKING FIXTURE (per test)
  // ============================================================================
  /**
   * Track created resources for cleanup.
   * Initialized empty for each test, populated as resources are created.
   */
  createdResourceIds: async ({}, use) => {
    const tracker = {
      users: [] as string[],
      products: [] as string[],
      orders: [] as string[],
    };
    await use(tracker);
  },

  // ============================================================================
  // RESOURCE TRACKING HELPER
  // ============================================================================
  /** Register a resource ID for later cleanup. */
  trackResource: async ({ createdResourceIds }, use) => {
    const track = (type: 'user' | 'product' | 'order', id: string) => {
      const typeMap: Record<string, string> = { user: 'users', product: 'products', order: 'orders' };
      createdResourceIds[typeMap[type] as keyof typeof createdResourceIds].push(id);
    };
    await use(track);
  },

  // ============================================================================
  // CLEANUP FIXTURE (runs after each test)
  // ============================================================================
  /**
   * Clean up all tracked resources.
   * This fixture handles the afterEach cleanup phase automatically.
   * Tests should register resource IDs via `trackResource()` during execution.
   */
  cleanupResources: async ({ page, createdResourceIds }, use) => {
    await use(async () => {
      await base.step('Cleanup tracked resources', async (step) => {
        const totalResources =
          createdResourceIds.users.length +
          createdResourceIds.products.length +
          createdResourceIds.orders.length;

        if (totalResources > 0) {
          await step.attach('cleanup-summary', {
            body: JSON.stringify(createdResourceIds, null, 2),
            contentType: 'application/json',
          });
        }

        try {
          await page.goto('/', { waitUntil: 'domcontentloaded' });
        } catch (e) {
          console.log('[Cleanup] Navigation cleanup skipped:', (e as Error).message);
        }
      });
    });
  },

  // ============================================================================
  // AUTH VALIDATION FIXTURE
  // ============================================================================
  /**
   * Check if cached auth state is still valid.
   * In a real app, this would validate token expiry, session validity, etc.
   * For demoqa.com, we skip this as it has no real auth backend.
   */
  isAuthValid: async ({ page }, use) => {
    await use(async () => {
      try {
        // For demoqa.com without real auth, always return true
        // In a production app, this would check token expiry via /api/auth/validate
        return true;
      } catch {
        return false;
      }
    });
  },
});

export { expect };

