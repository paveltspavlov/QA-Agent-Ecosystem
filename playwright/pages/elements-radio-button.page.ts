import { test, Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ElementsRadioButtonPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  getRadioButton(label: string): Locator {
    return this.page.getByRole('radio', { name: label });
  }

  async selectOption(label: string): Promise<void> {
    await test.step(`Select radio option "${label}"`, async () => {
      const radioButton = this.getRadioButton(label);
      await radioButton.check();
    });
  }
}
