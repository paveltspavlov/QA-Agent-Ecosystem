import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AlertsModalDialogsPage extends BasePage {
  readonly smallModalButton: Locator = this.page.locator('button#showSmallModal');
  readonly largeModalButton: Locator = this.page.locator('button#showLargeModal');
  readonly smallModal: Locator = this.page.locator('#smallModal');
  readonly largeModal: Locator = this.page.locator('#largeModal');
  readonly closeSmallButton: Locator = this.page.locator('#smallModal button.btn-secondary');
  readonly closeLargeButton: Locator = this.page.locator('#largeModal button.btn-secondary');

  constructor(page: Page) {
    super(page);
  }

  async clickSmallModalButton(): Promise<void> {
    await this.smallModalButton.click();
  }

  async clickLargeModalButton(): Promise<void> {
    await this.largeModalButton.click();
  }

  getSmallModal(): Locator {
    return this.smallModal;
  }

  getLargeModal(): Locator {
    return this.largeModal;
  }

  async closeSmallModal(): Promise<void> {
    await this.closeSmallButton.click();
  }

  async closeLargeModal(): Promise<void> {
    await this.closeLargeButton.click();
  }
}
