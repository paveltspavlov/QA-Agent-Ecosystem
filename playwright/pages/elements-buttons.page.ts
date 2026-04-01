import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ElementsButtonsPage extends BasePage {
  readonly clickMeButton: Locator = this.page.locator('button:has-text("Click Me")');
  readonly doubleClickButton: Locator = this.page.locator('button:has-text("Double Click Me")');
  readonly rightClickButton: Locator = this.page.locator('button:has-text("Right Click Me")');
  readonly singleClickMessage: Locator = this.page.locator('#dynamicClickMessage');
  readonly doubleClickMessage: Locator = this.page.locator('#doubleClickMessage');
  readonly rightClickMessage: Locator = this.page.locator('#rightClickMessage');

  constructor(page: Page) {
    super(page);
  }

  async clickClickMeButton(): Promise<void> {
    await this.clickMeButton.click();
  }

  async doubleClickDoubleClickButton(): Promise<void> {
    await this.doubleClickButton.dblclick();
  }

  async rightClickRightClickButton(): Promise<void> {
    await this.rightClickButton.click({ button: 'right' });
  }

  getSingleClickMessage(): Locator {
    return this.singleClickMessage;
  }

  getDoubleClickMessage(): Locator {
    return this.doubleClickMessage;
  }

  getRightClickMessage(): Locator {
    return this.rightClickMessage;
  }
}
