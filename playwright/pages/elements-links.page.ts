import { test, Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ElementsLinksPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async clickLink(linkText: string): Promise<void> {
    await test.step(`Click link "${linkText}"`, async () => {
      if (linkText === 'Home') {
        await this.page.locator('#simpleLink').click();
      } else {
        await this.page.getByRole('link', { name: linkText, exact: true }).click();
      }
    });
  }
}
