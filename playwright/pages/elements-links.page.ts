import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ElementsLinksPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async clickLink(linkText: string): Promise<void> {
    const link = this.page.getByRole('link', { name: linkText });
    await link.click();
  }
}
