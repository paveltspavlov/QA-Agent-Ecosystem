import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AlertsBrowserWindowsPage extends BasePage {
  readonly newWindowButton: Locator = this.page.locator('button#windowButton');
  readonly newTabButton: Locator = this.page.locator('button#tabButton');
  readonly newWindowMessageButton: Locator = this.page.locator('button#messageWindowButton');

  constructor(page: Page) {
    super(page);
  }

  async clickNewWindowButton(): Promise<void> {
    await this.newWindowButton.click();
  }

  async clickNewTabButton(): Promise<void> {
    await this.newTabButton.click();
  }

  async clickNewWindowMessageButton(): Promise<void> {
    await this.newWindowMessageButton.click();
  }
}
