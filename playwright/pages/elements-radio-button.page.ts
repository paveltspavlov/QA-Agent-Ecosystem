import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ElementsRadioButtonPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  getRadioButton(label: string): Locator {
    return this.page.locator(`label:has-text("${label}") input[type="radio"]`);
  }

  async selectOption(label: string): Promise<void> {
    const radioButton = this.getRadioButton(label);
    await radioButton.check();
  }
}
