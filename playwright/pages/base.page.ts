import { test, type Page, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../helpers/timeouts';

/** Base page object — all page objects extend this. */
export class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigate to a path relative to baseURL. */
  async goto(path: string): Promise<void> {
    await test.step(`Navigate to ${path}`, async () => {
      await this.page.goto(path, { timeout: TIMEOUTS.NAVIGATION });
    });
  }

  /** Wait for the page to reach a stable network-idle state. */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NAVIGATION });
  }

  /** Take a screenshot and return its buffer. */
  async screenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  /** Get a locator by role (preferred strategy). */
  getByRole(role: Parameters<Page['getByRole']>[0], options?: Parameters<Page['getByRole']>[1]): Locator {
    return this.page.getByRole(role, options);
  }

  /** Get a locator by test ID. */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /** Get a locator by visible text. */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /** Get only visible elements matching a locator. (Playwright 1.51+) */
  getVisible(locator: Locator): Locator {
    return locator.filter({ visible: true });
  }

  /** Scroll element into view. */
  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }
}
