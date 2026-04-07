import { test, Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * PracticeFormPage - Complex form with multiple input types
 */
export class PracticeFormPage extends BasePage {
  readonly firstNameInput = this.page.getByPlaceholder('First Name');
  readonly lastNameInput = this.page.getByPlaceholder('Last Name');
  readonly emailInput = this.page.getByPlaceholder('name@example.com');
  readonly phoneInput = this.page.getByPlaceholder('Mobile Number');
  readonly dateOfBirthInput = this.page.locator('input#dateOfBirthInput');
  readonly addressInput = this.page.locator('textarea[placeholder="Current Address"]');
  readonly stateSelect = this.page.locator('#state');
  readonly citySelect = this.page.locator('#city');
  readonly submitButton = this.page.getByRole('button', { name: 'Submit' });
  readonly resetButton = this.page.getByRole('button', { name: 'Reset' });

  async navigateToPracticeForm() {
    const formsLink = this.page.getByRole('link', { name: 'Forms' });
    await formsLink.click();
    const practiceFormLink = this.page.getByRole('link', { name: /practice form/i });
    await practiceFormLink.click();
    await this.waitForLoad();
  }

  async fillFirstName(name: string) {
    await this.firstNameInput.fill(name);
  }

  async fillLastName(name: string) {
    await this.lastNameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPhone(phone: string) {
    await this.phoneInput.fill(phone);
  }

  async fillAddress(address: string) {
    await this.addressInput.fill(address);
  }

  async selectGender(gender: 'Male' | 'Female' | 'Other') {
    const genderRadio = this.page.locator(`input[name="gender"][value="${gender.toLowerCase()}"]`);
    await genderRadio.check();
  }

  getGenderRadio(gender: string): Locator {
    return this.page.locator(`input[name="gender"][value="${gender.toLowerCase()}"]`);
  }

  async selectHobby(hobby: string) {
    const hobbyCheckbox = this.page.locator(`input[name="hobbies"][value*="${hobby.toLowerCase()}"]`);
    const isChecked = await hobbyCheckbox.isChecked();
    if (!isChecked) {
      await hobbyCheckbox.check();
    }
  }

  getHobbyCheckbox(hobby: string): Locator {
    return this.page.locator(`input[name="hobbies"][value*="${hobby.toLowerCase()}"]`);
  }

  async openDatePicker() {
    await this.dateOfBirthInput.click();
  }

  getDatePicker(): Locator {
    return this.page.locator('[class*="datepicker"]').first();
  }

  async selectDate(day: number, month: string, year: number) {
    // Navigate to the calendar
    const dayButton = this.page.locator(`.react-datepicker__day:has-text("${day}")`).first();
    await dayButton.click();
  }

  async focusSubjectField() {
    const subjectInput = this.page.locator('input[id="subjectsInput"]');
    await subjectInput.focus();
  }

  async typeSubject(subject: string) {
    const subjectInput = this.page.locator('input[id="subjectsInput"]');
    await subjectInput.pressSequentially(subject);
  }

  getSubjectSuggestions(): Locator {
    return this.page.locator('.css-1wy0on6 > div');
  }

  getSelectedSubject(subject: string): Locator {
    return this.page.locator(`.css-qubchf:has-text("${subject}")`);
  }

  async selectState(state: string) {
    const stateInput = this.page.locator('#state input');
    await stateInput.click();
    const stateOption = this.page.locator(`div[id*="react-select-3-option-"]:has-text("${state}")`);
    await stateOption.click();
  }

  async selectCity(city: string) {
    const cityInput = this.page.locator('#city input');
    await cityInput.click();
    const cityOption = this.page.locator(`div[id*="react-select-4-option-"]:has-text("${city}")`);
    await cityOption.click();
  }

  async submitForm() {
    await test.step('Submit practice form', async () => {
      await this.submitButton.scrollIntoViewIfNeeded();
      await this.submitButton.click();
    });
  }

  async resetForm() {
    await this.resetButton.click();
  }

  getSuccessModal(): Locator {
    return this.page.locator('.modal-dialog');
  }

  getFormTitle(): Locator {
    return this.page.getByText('Student Registration Form');
  }
}

/**
 * CheckBoxPage - Checkbox tree structure interactions
 */
export class CheckBoxPage extends BasePage {
  readonly expandAllButton = this.page.getByRole('button', { name: /expand all/i });
  readonly collapseAllButton = this.page.getByRole('button', { name: /collapse all/i });

  async navigateToCheckBox() {
    const elementsLink = this.page.getByRole('link', { name: 'Elements' });
    await elementsLink.click();
    const checkBoxLink = this.page.getByRole('link', { name: 'Check Box' });
    await checkBoxLink.click();
    await this.waitForLoad();
  }

  async expandAll() {
    await this.expandAllButton.click();
  }

  async collapseAll() {
    await this.collapseAllButton.click();
  }

  getCheckbox(label: string): Locator {
    return this.page.locator(`input[type="checkbox"][id*="${label.toLowerCase()}"]`).first();
  }

  async selectCheckbox(label: string) {
    const checkbox = this.getCheckbox(label);
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }
  }

  async deselectCheckbox(label: string) {
    const checkbox = this.getCheckbox(label);
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
    }
  }

  isCheckboxChecked(label: string): Promise<boolean> {
    return this.getCheckbox(label).isChecked();
  }
}

/**
 * RadioButtonPage - Radio button selection tests
 */
export class RadioButtonPage extends BasePage {
  readonly yesRadio = this.page.locator('input[id="yesRadio"]');
  readonly impressiveRadio = this.page.locator('input[id="impressiveRadio"]');
  readonly noRadio = this.page.locator('input[id="noRadio"]');
  readonly resultText = this.page.locator('.mt-3');

  async navigateToRadioButton() {
    const elementsLink = this.page.getByRole('link', { name: 'Elements' });
    await elementsLink.click();
    const radioLink = this.page.getByRole('link', { name: 'Radio Button' });
    await radioLink.click();
    await this.waitForLoad();
  }

  async selectYes() {
    await this.yesRadio.check();
  }

  async selectImpressive() {
    await this.impressiveRadio.check();
  }

  async selectNo() {
    await this.noRadio.check();
  }

  getRadioButton(value: string): Locator {
    return this.page.locator(`input[value="${value}"]`);
  }

  async selectRadioByValue(value: string) {
    const radio = this.getRadioButton(value);
    await radio.check();
  }

  isRadioSelected(value: string): Promise<boolean> {
    return this.getRadioButton(value).isChecked();
  }

  getResultText(): Locator {
    return this.resultText;
  }
}

/**
 * LinksPage - Link navigation and status code testing
 */
export class LinksPage extends BasePage {
  readonly homeLink = this.page.getByRole('link', { name: 'Home' });
  readonly links = this.page.locator('a[id^="link"]');
  readonly linkResponse = this.page.locator('#linkResponse');

  async navigateToLinks() {
    const elementsLink = this.page.getByRole('link', { name: 'Elements' });
    await elementsLink.click();
    const linksLink = this.page.getByRole('link', { name: /^Links$/ });
    await linksLink.click();
    await this.waitForLoad();
  }

  async clickHomeLink() {
    await this.homeLink.click();
  }

  getLinkByText(text: string): Locator {
    return this.page.getByRole('link', { name: text });
  }

  getLinkResponse(): Locator {
    return this.linkResponse;
  }

  async waitForLinkResponse() {
    await this.linkResponse.waitFor({ state: 'visible' });
  }
}

/**
 * DynamicPropertiesPage - Dynamically changing element properties
 */
export class DynamicPropertiesPage extends BasePage {
  readonly enableButton = this.page.getByRole('button', { name: /will enable in/i });
  readonly colorChangeButton = this.page.getByRole('button', { name: /will change color/i });
  readonly visibleButton = this.page.getByRole('button', { name: /will appear/i });

  async navigateToDynamicProperties() {
    const elementsLink = this.page.getByRole('link', { name: 'Elements' });
    await elementsLink.click();
    const dynamicLink = this.page.getByRole('link', { name: 'Dynamic Properties' });
    await dynamicLink.click();
    await this.waitForLoad();
  }

  async waitForButtonToEnable() {
    await this.enableButton.waitFor({ state: 'visible', timeout: 6000 });
  }

  async waitForButtonColorChange() {
    // Wait for element visibility with potential color change
    await this.colorChangeButton.waitFor({ state: 'visible', timeout: 6000 });
  }

  async waitForButtonToAppear() {
    await this.visibleButton.waitFor({ state: 'visible', timeout: 6000 });
  }

  getEnableButton(): Locator {
    return this.enableButton;
  }

  getColorButton(): Locator {
    return this.colorChangeButton;
  }

  getVisibleButton(): Locator {
    return this.visibleButton;
  }
}

/**
 * UploadDownloadPage - File upload and download operations
 */
export class UploadDownloadPage extends BasePage {
  readonly downloadLink = this.page.getByRole('link', { name: /download/i });
  readonly uploadInput = this.page.locator('input[type="file"]');
  readonly uploadButton = this.page.getByRole('button', { name: /upload/i });
  readonly uploadResult = this.page.locator('#uploadedFilePath');

  async navigateToUploadDownload() {
    const elementsLink = this.page.getByRole('link', { name: 'Elements' });
    await elementsLink.click();
    const uploadLink = this.page.getByRole('link', { name: /upload and download/i });
    await uploadLink.click();
    await this.waitForLoad();
  }

  async downloadFile() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadLink.click();
    const download = await downloadPromise;
    return download;
  }

  async uploadFile(filePath: string) {
    await this.uploadInput.setInputFiles(filePath);
    await this.uploadButton.click();
    await this.uploadResult.waitFor({ state: 'visible' });
  }

  getUploadResult(): Locator {
    return this.uploadResult;
  }
}

/**
 * FormsPage - Navigation to Forms section
 */
export class FormsPage extends BasePage {
  async navigateToForms() {
    const formsLink = this.page.getByRole('link', { name: 'Forms' });
    await formsLink.click();
    await this.waitForLoad();
  }
}
