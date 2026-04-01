import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * ElementsPage - Tests for the Elements section
 * Includes: Text Box, Buttons, Links, Dynamic Properties, etc.
 */
export class ElementsPage extends BasePage {
  // Sidebar navigation
  readonly textBoxLink = this.page.getByRole('link', { name: 'Text Box' });
  readonly checkBoxLink = this.page.getByRole('link', { name: 'Check Box' });
  readonly radioButtonLink = this.page.getByRole('link', { name: 'Radio Button' });
  readonly webTablesLink = this.page.getByRole('link', { name: 'Web Tables' });
  readonly buttonsLink = this.page.getByRole('link', { name: 'Buttons' });
  readonly linksLink = this.page.getByRole('link', { name: 'Links' });
  readonly brokenLinksLink = this.page.getByRole('link', { name: 'Broken Links - Images' });
  readonly downloadUploadLink = this.page.getByRole('link', { name: 'Upload and Download' });
  readonly dynamicPropertiesLink = this.page.getByRole('link', { name: 'Dynamic Properties' });

  // Navigation methods
  async navigateToTextBox() {
    await this.textBoxLink.click();
  }

  async navigateToCheckBox() {
    await this.checkBoxLink.click();
  }

  async navigateToRadioButton() {
    await this.radioButtonLink.click();
  }

  async navigateToWebTables() {
    await this.webTablesLink.click();
  }

  async navigateToButtons() {
    await this.buttonsLink.click();
  }

  async navigateToLinks() {
    await this.linksLink.click();
  }

  async navigateToUploadDownload() {
    await this.downloadUploadLink.click();
  }

  async navigateToDynamicProperties() {
    await this.dynamicPropertiesLink.click();
  }
}

/**
 * TextBoxPage - Tests for Text Box element
 */
export class TextBoxPage extends BasePage {
  readonly fullNameInput = this.page.getByPlaceholder('Full Name');
  readonly emailInput = this.page.getByPlaceholder('name@example.com');
  readonly currentAddressInput = this.page.locator('textarea').first();
  readonly permanentAddressInput = this.page.locator('textarea').last();
  readonly submitButton = this.page.getByRole('button', { name: 'Submit' });
  readonly outputSection = this.page.locator('#output');

  async fillForm(data: { fullName: string; email: string; currentAddress: string; permanentAddress: string }) {
    await this.fullNameInput.fill(data.fullName);
    await this.emailInput.fill(data.email);
    await this.currentAddressInput.fill(data.currentAddress);
    await this.permanentAddressInput.fill(data.permanentAddress);
  }

  async submit() {
    await this.submitButton.click();
  }

  async isOutputVisible(): Promise<boolean> {
    return this.outputSection.isVisible();
  }
}

/**
 * ButtonsPage - Tests for Buttons element
 */
export class ButtonsPage extends BasePage {
  readonly doubleClickBtn = this.page.getByRole('button', { name: 'Double Click Me' });
  readonly rightClickBtn = this.page.getByRole('button', { name: 'Right Click Me' });
  readonly clickBtn = this.page.getByRole('button', { name: 'Click Me', exact: true });
  readonly doubleClickMessage = this.page.locator('#doubleClickMessage');
  readonly rightClickMessage = this.page.locator('#rightClickMessage');
  readonly clickMessage = this.page.locator('#dynamicClickMessage');

  async doubleClick() {
    await this.doubleClickBtn.dblclick();
  }

  async rightClick() {
    await this.rightClickBtn.click({ button: 'right' });
  }

  async singleClick() {
    await this.clickBtn.click();
  }

  async isDoubleClickMessageVisible(): Promise<boolean> {
    return this.doubleClickMessage.isVisible();
  }

  async isRightClickMessageVisible(): Promise<boolean> {
    return this.rightClickMessage.isVisible();
  }

  async isClickMessageVisible(): Promise<boolean> {
    return this.clickMessage.isVisible();
  }
}

/**
 * WebTablesPage - Tests for Web Tables element
 */
export class WebTablesPage extends BasePage {
  readonly addButton = this.page.getByRole('button', { name: 'Add' });
  readonly editButtons = this.page.locator('button[title="Edit"]');
  readonly deleteButtons = this.page.locator('button[title="Delete"]');
  readonly searchInput = this.page.locator('#searchBox');
  readonly table = this.page.locator('table');

  async clickAdd() {
    await this.addButton.click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
  }

  async isTableVisible(): Promise<boolean> {
    return this.table.isVisible();
  }

  async getTableRowCount(): Promise<number> {
    return this.page.locator('tr').count();
  }
}

/**
 * LinksPage - Tests for Links element
 */
export class LinksPage extends BasePage {
  readonly homeLink = this.page.getByRole('link', { name: /^Home$/i });
  readonly helloLink = this.page.getByRole('link', { name: 'Hello' });
  readonly apiCallLink = this.page.getByRole('link', { name: 'Created' });
  readonly responseMessage = this.page.locator('#linkResponse');

  async clickHomeLink() {
    await this.homeLink.click();
  }

  async clickHelloLink() {
    await this.helloLink.click();
  }

  async clickApiCallLink() {
    await this.apiCallLink.click();
  }

  async isResponseMessageVisible(): Promise<boolean> {
    return this.responseMessage.isVisible();
  }

  async getResponseText(): Promise<string | null> {
    return this.responseMessage.textContent();
  }
}
