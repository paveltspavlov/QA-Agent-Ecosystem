import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * AlertsPage - Tests for Alerts, Frame & Windows section
 */
export class AlertsPage extends BasePage {
  readonly alertsLink = this.page.getByRole('link', { name: 'Browser Windows' });
  readonly alertBoxLink = this.page.getByRole('link', { name: 'Alerts' });
  readonly framesLink = this.page.getByRole('link', { name: 'Frames' });
  readonly nestedFramesLink = this.page.getByRole('link', { name: 'Nested Frames' });
  readonly modalDialogsLink = this.page.getByRole('link', { name: 'Modal Dialogs' });

  async navigateToBrowserWindows() {
    await this.alertsLink.click();
  }

  async navigateToAlerts() {
    await this.alertBoxLink.click();
  }

  async navigateToFrames() {
    await this.framesLink.click();
  }

  async navigateToNestedFrames() {
    await this.nestedFramesLink.click();
  }

  async navigateToModalDialogs() {
    await this.modalDialogsLink.click();
  }
}

/**
 * AlertsBoxPage - Tests for JavaScript alerts and confirmations
 */
export class AlertsBoxPage extends BasePage {
  readonly alertButton = this.page.getByRole('button', { name: 'Click Button to see alert' });
  readonly confirmButton = this.page.getByRole('button', { name: 'On button click, confirm box will appear' });
  readonly promptButton = this.page.getByRole('button', { name: 'On button click, prompt box will appear' });
  readonly result = this.page.locator('#confirmResult');

  async clickAlertButton() {
    this.page.once('dialog', (dialog) => {
      dialog.accept();
    });
    await this.alertButton.click();
  }

  async clickConfirmAndAccept() {
    this.page.once('dialog', (dialog) => {
      dialog.accept();
    });
    await this.confirmButton.click();
  }

  async clickConfirmAndReject() {
    this.page.once('dialog', (dialog) => {
      dialog.dismiss();
    });
    await this.confirmButton.click();
  }

  async clickPromptAndEnterText(text: string) {
    this.page.once('dialog', (dialog) => {
      dialog.accept(text);
    });
    await this.promptButton.click();
  }

  async getResultText(): Promise<string | null> {
    return this.result.textContent();
  }
}

/**
 * FramesPage - Tests for Frames
 */
export class FramesPage extends BasePage {
  readonly frame1 = this.page.frameLocator('iframe[id="frame1"]');
  readonly frame2 = this.page.frameLocator('iframe[id="frame2"]');

  async getFrame1Content(): Promise<string | null> {
    return this.frame1.locator('body').textContent();
  }

  async getFrame2Content(): Promise<string | null> {
    return this.frame2.locator('body').textContent();
  }
}

/**
 * ModalDialogsPage - Tests for Modal dialogs
 */
export class ModalDialogsPage extends BasePage {
  readonly smallModalButton = this.page.getByRole('button', { name: 'Small modal' });
  readonly largeModalButton = this.page.getByRole('button', { name: 'Large modal' });
  readonly modalCloseButton = this.page.locator('.btn-close');
  readonly modalBackdrop = this.page.locator('.modal');

  async openSmallModal() {
    await this.smallModalButton.click();
  }

  async openLargeModal() {
    await this.largeModalButton.click();
  }

  async closeModal() {
    await this.modalCloseButton.click();
  }

  async isModalVisible(): Promise<boolean> {
    return this.modalBackdrop.first().isVisible();
  }
}

/**
 * BrowserWindowsPage - Tests for opening new windows
 */
export class BrowserWindowsPage extends BasePage {
  readonly newWindowButton = this.page.getByRole('button', { name: 'New Window' });
  readonly newWindowMessageButton = this.page.getByRole('button', { name: 'New Window Message' });
  readonly newTabButton = this.page.getByRole('button', { name: 'New Tab' });

  async openNewWindow() {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.newWindowButton.click(),
    ]);
    return newPage;
  }

  async openNewTab() {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.newTabButton.click(),
    ]);
    return newPage;
  }

  async openNewWindowWithMessage() {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.newWindowMessageButton.click(),
    ]);
    return newPage;
  }
}
