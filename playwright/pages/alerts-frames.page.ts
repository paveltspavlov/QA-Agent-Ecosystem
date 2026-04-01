import { Page, Locator, FrameLocator } from '@playwright/test';
import { BasePage } from './base.page';

export class AlertsFramesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  getMainFrame(): FrameLocator {
    return this.page.frameLocator('#frame1');
  }
}
