import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ElementsCheckboxPage extends BasePage {
  readonly expandAllButton: Locator = this.page.locator('button.rct-option-expand-all');
  readonly checkboxItems: Locator = this.page.locator('.rct-checkbox');
  readonly selectedItemsList: Locator = this.page.locator('#result');

  constructor(page: Page) {
    super(page);
  }

  async expandAll(): Promise<void> {
    await this.expandAllButton.click();
  }

  async selectCheckbox(label: string): Promise<void> {
    const checkboxLabel = this.page.locator(`label:has-text("${label}")`);
    const checkbox = checkboxLabel.locator('input[type="checkbox"]');
    await checkbox.check();
  }

  async deselectCheckbox(label: string): Promise<void> {
    const checkboxLabel = this.page.locator(`label:has-text("${label}")`);
    const checkbox = checkboxLabel.locator('input[type="checkbox"]');
    await checkbox.uncheck();
  }

  getSelectedItemsList(): Locator {
    return this.selectedItemsList;
  }
}
