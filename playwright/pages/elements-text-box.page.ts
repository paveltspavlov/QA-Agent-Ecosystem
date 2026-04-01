import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ElementsTextBoxPage extends BasePage {
  readonly fullNameInput: Locator = this.page.locator('#userName');
  readonly emailInput: Locator = this.page.locator('#userEmail');
  readonly currentAddressInput: Locator = this.page.locator('#currentAddress');
  readonly permanentAddressInput: Locator = this.page.locator('#permanentAddress');
  readonly submitButton: Locator = this.page.locator('button[id="submit"]');
  readonly outputBox: Locator = this.page.locator('#output');

  constructor(page: Page) {
    super(page);
  }

  async fillFullName(name: string): Promise<void> {
    await this.fullNameInput.fill(name);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillCurrentAddress(address: string): Promise<void> {
    await this.currentAddressInput.fill(address);
  }

  async fillPermanentAddress(address: string): Promise<void> {
    await this.permanentAddressInput.fill(address);
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  getSubmissionOutput(): Locator {
    return this.outputBox;
  }
}
