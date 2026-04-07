import { test, Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ElementsButtonsPage extends BasePage {
  readonly clickMeButton: Locator = this.page.getByRole('button', { name: /^Click Me$/i });
  readonly doubleClickButton: Locator = this.page.getByRole('button', { name: /^Double Click Me$/i });
  readonly rightClickButton: Locator = this.page.getByRole('button', { name: /^Right Click Me$/i });
  readonly singleClickMessage: Locator = this.page.locator('#dynamicClickMessage');
  readonly doubleClickMessage: Locator = this.page.locator('#doubleClickMessage');
  readonly rightClickMessage: Locator = this.page.locator('#rightClickMessage');

  constructor(page: Page) {
    super(page);
  }

  async clickClickMeButton(): Promise<void> {
    await test.step('Single click "Click Me" button', async () => {
      await this.clickMeButton.click();
    });
  }

  async doubleClickDoubleClickButton(): Promise<void> {
    await test.step('Double click button', async () => {
      await this.doubleClickButton.dblclick();
    });
  }

  async rightClickRightClickButton(): Promise<void> {
    await test.step('Right click button', async () => {
      await this.rightClickButton.click({ button: 'right' });
    });
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
