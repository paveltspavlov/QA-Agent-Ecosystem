import { Page } from '@playwright/test';

/**
 * Test Lifecycle Utilities
 *
 * Helpers for managing test setup, teardown, and resource cleanup.
 * Follows Playwright best practices for fixture management.
 */

/**
 * Resource cleanup tracker — collects IDs of resources created during a test
 * for batch cleanup in afterEach hooks.
 */
export class ResourceCleanupTracker {
  private resources: Map<string, Set<string>> = new Map([
    ['users', new Set()],
    ['products', new Set()],
    ['orders', new Set()],
    ['books', new Set()],
  ]);

  /** Register a created resource ID for tracking. */
  track(type: string, id: string): void {
    if (!this.resources.has(type)) {
      this.resources.set(type, new Set());
    }
    this.resources.get(type)!.add(id);
  }

  /** Get all tracked IDs for a resource type. */
  getIds(type: string): string[] {
    return Array.from(this.resources.get(type) || []);
  }

  /** Get all tracked resources as object. */
  getAllTracked(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [type, ids] of this.resources) {
      result[type] = Array.from(ids);
    }
    return result;
  }

  /** Clear tracked resources (useful for multi-part tests). */
  clear(): void {
    for (const set of this.resources.values()) {
      set.clear();
    }
  }

  /** Total number of tracked resources. */
  get total(): number {
    let count = 0;
    for (const set of this.resources.values()) {
      count += set.size;
    }
    return count;
  }
}

/**
 * Page state manager — helpers for managing page navigation and state.
 */
export class PageStateManager {
  constructor(private page: Page) {}

  /**
   * Navigate to a path and wait for specific indicators.
   * Useful for ensuring page has loaded before proceeding.
   */
  async navigateAndWait(
    path: string,
    options?: {
      waitForSelector?: string;
      waitForText?: string;
      timeout?: number;
    },
  ): Promise<void> {
    await this.page.goto(path);

    if (options?.waitForSelector) {
      await this.page.waitForSelector(options.waitForSelector, { timeout: options.timeout });
    }

    if (options?.waitForText) {
      await this.page.getByText(options.waitForText).waitFor({ timeout: options.timeout });
    }
  }

  /**
   * Clear localStorage and sessionStorage to ensure clean state.
   */
  async clearBrowserStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Take a screenshot with test context.
   */
  async screenshot(name: string, directory = 'test-results/screenshots'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${directory}/${name}-${timestamp}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
    return filename;
  }

  /**
   * Get current URL path (without domain/protocol).
   */
  getCurrentPath(): string {
    const url = new URL(this.page.url());
    return url.pathname + url.search + url.hash;
  }

  /**
   * Wait for page to idle (no pending network requests).
   */
  async waitForIdle(timeout = 10_000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }
}

/**
 * Cleanup assertion utilities — verify cleanup was successful.
 */
export class CleanupAssertions {
  /**
   * Assert that a page has been cleared of user-created data.
   * In a real app, this would check for absence of test data via API.
   */
  static async assertPageIsClean(page: Page): Promise<void> {
    // For demoqa.com, this is mostly a verification that page loads cleanly
    const body = page.locator('body');
    if (!(await body.isVisible())) {
      throw new Error('Page not ready after cleanup');
    }
  }

  /**
   * Assert that a specific DOM element is absent (useful for cleanup verification).
   */
  static async assertElementNotPresent(page: Page, selector: string): Promise<void> {
    const element = page.locator(selector);
    if (await element.isVisible()) {
      throw new Error(`Element should not be present: ${selector}`);
    }
  }
}

/**
 * Test tagging utilities — for organizing tests by type/scope.
 */
export const TestTags = {
  /** @smoke - Fast, critical path tests (< 30s each) */
  SMOKE: '@smoke',

  /** @ui - UI-layer tests */
  UI: '@ui',

  /** @api - API integration tests */
  API: '@api',

  /** @regression - Comprehensive test coverage */
  REGRESSION: '@regression',

  /** @forms - Form-related tests */
  FORMS: '@forms',

  /** @elements - Element interaction tests */
  ELEMENTS: '@elements',

  /** @widgets - Widget interaction tests */
  WIDGETS: '@widgets',

  /** @accessibility - Accessibility compliance tests */
  ACCESSIBILITY: '@accessibility',

  /** @slow - Long-running tests (> 60s) */
  SLOW: '@slow',
} as const;

/**
 * Run ID generator — creates unique ID for batch cleanup tracking.
 * All test-created data is tagged with run ID for easy batch deletion.
 */
export function generateRunId(prefix = 'run'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Test context builder — helps create consistent test context.
 */
export interface TestContext {
  runId: string;
  startTime: Date;
  cleanupTracker: ResourceCleanupTracker;
  pageState: PageStateManager;
}

export function createTestContext(page: Page): TestContext {
  return {
    runId: generateRunId(),
    startTime: new Date(),
    cleanupTracker: new ResourceCleanupTracker(),
    pageState: new PageStateManager(page),
  };
}
