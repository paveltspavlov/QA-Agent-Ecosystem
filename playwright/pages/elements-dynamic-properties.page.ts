import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ElementsDynamicPropertiesPage extends BasePage {
  readonly willEnableButton: Locator = this.page.locator('button#enableAfter');
  readonly buttonResponse: Locator = this.page.locator('#dynamicEnable');

  constructor(page: Page) {
    super(page);
  }

  getWillEnableButton(): Locator {
    return this.willEnableButton;
  }

  getButtonResponse(): Locator {
    return this.buttonResponse;
  }
}
