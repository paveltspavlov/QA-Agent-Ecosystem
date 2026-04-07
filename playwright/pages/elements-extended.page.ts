import { test, Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * TextBoxPage - Text Box form submission and validation
 */
export class TextBoxPage extends BasePage {
  readonly fullNameInput = this.page.getByPlaceholder('Full Name');
  readonly emailInput = this.page.getByPlaceholder('name@example.com');
  readonly currentAddressInput = this.page.locator('textarea[placeholder="Current Address"]');
  readonly permanentAddressInput = this.page.locator('textarea[placeholder="Permanent Address"]');
  readonly submitButton = this.page.getByRole('button', { name: 'Submit' });
  readonly outputSection = this.page.locator('#output');

  async navigateToTextBox() {
    // From Elements section, click Text Box
    const elementsLink = this.page.getByRole('link', { name: 'Elements' });
    await elementsLink.click();
    const textBoxLink = this.page.getByRole('link', { name: 'Text Box' });
    await textBoxLink.click();
    await this.waitForLoad();
  }

  async fillTextBoxForm(data: { 
    fullName: string; 
    email: string; 
    currentAddress: string; 
    permanentAddress: string 
  }) {
    await this.fullNameInput.fill(data.fullName);
    await this.emailInput.fill(data.email);
    await this.currentAddressInput.fill(data.currentAddress);
    await this.permanentAddressInput.fill(data.permanentAddress);
  }

  async submitForm() {
    await this.submitButton.click();
  }

  getSuccessOutput(): Locator {
    return this.outputSection;
  }

  async isOutputVisible(): Promise<boolean> {
    return this.getSuccessOutput().isVisible().catch(() => false);
  }
}

/**
 * WebTablesPage - Dynamic table CRUD operations
 */
export class WebTablesPage extends BasePage {
  readonly addButton = this.page.getByRole('button', { name: 'Add' });
  readonly tableBody = this.page.locator('tbody');
  readonly searchBox = this.page.getByPlaceholder('Type to search');
  readonly nextPageButton = this.page.getByRole('button', { name: 'Next' });
  readonly previousPageButton = this.page.getByRole('button', { name: 'Previous' });

  async navigateToWebTables() {
    const elementsLink = this.page.getByRole('link', { name: 'Elements' });
    await elementsLink.click();
    const webTablesLink = this.page.getByRole('link', { name: 'Web Tables' });
    await webTablesLink.click();
    await this.waitForLoad();
  }

  clickAddButton(): Promise<void> {
    return this.addButton.click();
  }

  getAddRowModal(): Locator {
    return this.page.locator('.modal-dialog').first();
  }

  getEditRowModal(): Locator {
    return this.page.locator('.modal-dialog').nth(1);
  }

  async fillAddRowForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    age: number;
    salary: number;
    department: string;
  }) {
    await this.page.getByPlaceholder('First Name').fill(data.firstName);
    await this.page.getByPlaceholder('Last Name').fill(data.lastName);
    await this.page.getByPlaceholder('name@example.com').fill(data.email);
    await this.page.getByPlaceholder('Age').fill(String(data.age));
    await this.page.getByPlaceholder('Salary').fill(String(data.salary));
    await this.page.getByPlaceholder('Department').fill(data.department);
  }

  async submitAddRowForm() {
    const modal = this.page.locator('.modal-dialog').first();
    const submitBtn = modal.getByRole('button', { name: 'Submit' });
    await submitBtn.click();
    await modal.waitFor({ state: 'hidden' });
  }

  async submitEditRowForm() {
    const modal = this.page.locator('.modal-dialog').nth(1);
    const submitBtn = modal.getByRole('button', { name: 'Submit' });
    await submitBtn.click();
    await modal.waitFor({ state: 'hidden' });
  }

  async updateRowForm(data: Partial<{ salary: number; age: number; department: string }>) {
    if (data.salary) {
      const salaryInput = this.page.getByPlaceholder('Salary');
      await salaryInput.clear();
      await salaryInput.fill(String(data.salary));
    }
    if (data.age) {
      const ageInput = this.page.getByPlaceholder('Age');
      await ageInput.clear();
      await ageInput.fill(String(data.age));
    }
    if (data.department) {
      const deptInput = this.page.getByPlaceholder('Department');
      await deptInput.clear();
      await deptInput.fill(data.department);
    }
  }

  getTableRows(): Locator {
    return this.page.locator('tbody tr');
  }

  getTableRowByName(firstName: string): Locator {
    return this.page.locator(`tbody tr:has-text("${firstName}")`).first();
  }

  async searchTable(query: string) {
    await test.step(`Search table for "${query}"`, async () => {
      await this.searchBox.fill(query);
    });
  }

  async clearSearch() {
    await this.searchBox.clear();
  }

  getNextPageButton(): Locator {
    return this.nextPageButton;
  }

  getPreviousPageButton(): Locator {
    return this.previousPageButton;
  }
}

/**
 * ExtendedButtonsPage - Click interactions (single, double, right-click)
 */
export class ExtendedButtonsPage extends BasePage {
  readonly singleClickButton = this.page.locator('#simpleClickBtn');
  readonly doubleClickButtonElement = this.page.locator('#doubleClickBtn');
  readonly rightClickButtonElement = this.page.locator('#rightClickBtn');
  readonly clickResultContainer = this.page.locator('#clickMessage');

  async navigateToButtons() {
    const elementsLink = this.page.getByRole('link', { name: 'Elements' });
    await elementsLink.click();
    const buttonsLink = this.page.getByRole('link', { name: 'Buttons' });
    await buttonsLink.click();
    await this.waitForLoad();
  }

  async clickSingleClickButton() {
    // Single click on a button element
    const clickMeButton = this.page.getByRole('button', { name: /click me/i }).first();
    await clickMeButton.click();
  }

  async doubleClickButton() {
    // Double-click interaction
    const doubleBtn = this.page.getByRole('button', { name: /double click/i });
    await doubleBtn.dblclick();
  }

  async rightClickButton() {
    // Right-click interaction
    const rightBtn = this.page.getByRole('button', { name: /right click/i });
    await rightBtn.click({ button: 'right' });
  }

  getClickMessage(messageText: string): Locator {
    return this.page.locator(`:text("${messageText}")`);
  }

  getClickMessageContainer(): Locator {
    return this.clickResultContainer;
  }

  getSingleClickButton(): Locator {
    return this.page.getByRole('button', { name: /click me/i }).first();
  }
}

/**
 * AlertsPage - Alert dialog interactions
 */
export class AlertsPage extends BasePage {
  readonly alertButton = this.page.getByRole('button', { name: 'Click Button to see alert' });
  readonly confirmButton = this.page.getByRole('button', { name: 'Click Button to see confirm' });
  readonly promptButton = this.page.getByRole('button', { name: 'Click Button to see prompt' });
  readonly alertResult = this.page.locator('#confirmResult');

  async navigateToAlerts() {
    const alertsLink = this.page.getByRole('link', { name: /alerts, frame & windows/i });
    await alertsLink.click();
    await this.waitForLoad();
  }

  async clickAlertButton() {
    await this.alertButton.click();
  }

  async clickConfirmButton() {
    await this.confirmButton.click();
  }

  async clickPromptButton() {
    await this.promptButton.click();
  }

  getAlertResult(): Locator {
    return this.alertResult;
  }

  getConfirmResult(): Locator {
    return this.alertResult;
  }

  getPromptResult(): Locator {
    return this.alertResult;
  }
}

/**
 * WidgetsPage - Accordion, date picker, tabs, sliders, progress
 */
export class WidgetsPage extends BasePage {
  readonly accordionPanel = this.page.locator('[class*="accordion"]');
  readonly datePicker = this.page.locator('[class*="datepicker"]');
  readonly slider = this.page.locator('[class*="slider"]');
  readonly progressBar = this.page.locator('[role="progressbar"]');
  readonly tabs = this.page.locator('[role="tab"]');

  async navigateToWidgets() {
    const widgetsLink = this.page.getByRole('link', { name: 'Widgets' });
    await widgetsLink.click();
    await this.waitForLoad();
  }

  getAccordionSection(sectionName: string): Locator {
    return this.page.locator(`.accordion-header:has-text("${sectionName}")`);
  }

  getAccordionContent(sectionName: string): Locator {
    return this.page.locator(`.accordion-collapse:has-text("${sectionName}")`);
  }

  async openDatePicker() {
    const dateInput = this.page.locator('input[type="text"][placeholder*="date" i]').first();
    await dateInput.click();
  }

  getDatePickerCalendar(): Locator {
    return this.page.locator('[class*="calendar"]');
  }

  getDateField(): Locator {
    return this.page.locator('input[type="text"][placeholder*="date" i]').first();
  }

  async selectDateInPicker(day: number, month: string, year: number) {
    // Navigate to correct month/year and click day
    const dayButton = this.page.locator(`button:has-text("${day}")`).first();
    await dayButton.click();
  }

  getSlider(): Locator {
    return this.page.locator('[role="slider"]').first();
  }

  async setSliderValue(value: number) {
    const slider = this.getSlider();
    const boundingBox = await slider.boundingBox();
    if (boundingBox) {
      const x = boundingBox.x + (boundingBox.width * value) / 100;
      const y = boundingBox.y + boundingBox.height / 2;
      await this.page.mouse.move(x, y);
      await this.page.mouse.down();
      await this.page.mouse.move(x, y);
      await this.page.mouse.up();
    }
  }

  async startProgress() {
    const startBtn = this.page.getByRole('button', { name: /start/i });
    await startBtn.click();
  }

  getProgressBar(): Locator {
    return this.page.locator('[role="progressbar"]').first();
  }

  getTab(tabName: string): Locator {
    return this.page.getByRole('tab', { name: tabName });
  }

  getTabContent(tabName: string): Locator {
    return this.page.locator(`[role="tabpanel"]:has-text("${tabName}")`);
  }
}

/**
 * ElementsPage - Navigation to Elements section
 */
export class ElementsPage extends BasePage {
  async navigateToElements() {
    const elementsLink = this.page.getByRole('link', { name: 'Elements' });
    await elementsLink.click();
    await this.waitForLoad();
  }
}
