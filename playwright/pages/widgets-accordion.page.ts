import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class WidgetsAccordionPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  getAccordionHeader(index: number): Locator {
    return this.page.locator('.accordion-button').nth(index);
  }

  getAccordionContent(index: number): Locator {
    return this.page.locator('.accordion-collapse .accordion-body').nth(index);
  }

  async expandAccordion(index: number): Promise<void> {
    const header = this.getAccordionHeader(index);
    await header.click();
  }
}
