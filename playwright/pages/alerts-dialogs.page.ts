import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AlertsPage extends BasePage {
  readonly simpleAlertButton: Locator = this.page.locator('button#alertButton');
  readonly confirmButton: Locator = this.page.locator('button#confirmButton');
  readonly promptButton: Locator = this.page.locator('button#promtButton');
  readonly simpleAlertResult: Locator = this.page.locator('#confirmResult');
  readonly confirmResult: Locator = this.page.locator('#confirmResult');
  readonly promptResult: Locator = this.page.locator('#confirmResult');

  constructor(page: Page) {
    super(page);
  }

  async clickSimpleAlertButton(): Promise<void> {
    await this.simpleAlertButton.click();
  }

  async clickConfirmButton(): Promise<void> {
    await this.confirmButton.click();
  }

  async clickPromptButton(): Promise<void> {
    await this.promptButton.click();
  }

  getSimpleAlertResult(): Locator {
    return this.simpleAlertResult;
  }

  getConfirmResult(): Locator {
    return this.confirmResult;
  }

  getPromptResult(): Locator {
    return this.promptResult;
  }
}
