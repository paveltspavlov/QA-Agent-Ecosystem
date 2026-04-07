import { test, Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ElementsCheckboxPage extends BasePage {
  readonly expandAllButton: Locator = this.page.locator('button[class*="rct-option-expand-all"], button:has-text("Expand all")');
  readonly checkboxItems: Locator = this.page.locator('.rct-checkbox');
  readonly selectedItemsList: Locator = this.page.locator('#result');

  constructor(page: Page) {
    super(page);
  }

  async expandAll(): Promise<void> {
    await this.expandAllButton.click();
  }

  async selectCheckbox(label: string): Promise<void> {
    await test.step(`Select checkbox "${label}"`, async () => {
      const checkboxLabel = this.page.locator('label').filter({ hasText: label });
      const checkbox = checkboxLabel.locator('input[type="checkbox"]');
      await checkbox.check();
    });
  }

  async deselectCheckbox(label: string): Promise<void> {
    await test.step(`Deselect checkbox "${label}"`, async () => {
      const checkboxLabel = this.page.locator('label').filter({ hasText: label });
      const checkbox = checkboxLabel.locator('input[type="checkbox"]');
      await checkbox.uncheck();
    });
  }

  getSelectedItemsList(): Locator {
    return this.selectedItemsList;
  }
}
