import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class FormsStudentRegistrationPage extends BasePage {
  readonly firstNameInput: Locator = this.page.locator('#firstName');
  readonly lastNameInput: Locator = this.page.locator('#lastName');
  readonly emailInput: Locator = this.page.locator('#userEmail');
  readonly mobileInput: Locator = this.page.locator('#userNumber');
  readonly dateOfBirthInput: Locator = this.page.locator('#dateOfBirthInput');
  readonly subjectsInput: Locator = this.page.locator('#subjectsInput');
  readonly currentAddressInput: Locator = this.page.locator('#currentAddress');
  readonly submitButton: Locator = this.page.locator('button#submit');
  readonly successModal: Locator = this.page.locator('.modal-body');
  readonly uploadInput: Locator = this.page.locator('#uploadPicture');

  constructor(page: Page) {
    super(page);
  }

  async fillFirstName(name: string): Promise<void> {
    await this.firstNameInput.fill(name);
  }

  async fillLastName(name: string): Promise<void> {
    await this.lastNameInput.fill(name);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async selectGender(gender: string): Promise<void> {
    await this.page.locator(`label:has-text("${gender}")`).click();
  }

  async fillMobileNumber(number: string): Promise<void> {
    await this.mobileInput.fill(number);
  }

  async setDateOfBirth(date: string): Promise<void> {
    await this.dateOfBirthInput.fill(date);
  }

  async addSubject(subject: string): Promise<void> {
    await this.subjectsInput.fill(subject);
    await this.page.keyboard.press('Enter');
  }

  async selectHobby(hobby: string): Promise<void> {
    const hobbyLabel = this.page.locator(`label:has-text("${hobby}")`);
    const checkbox = hobbyLabel.locator('input[type="checkbox"]');
    await checkbox.check();
  }

  async uploadPicture(filePath: string): Promise<void> {
    await this.uploadInput.setInputFiles(filePath);
  }

  async fillCurrentAddress(address: string): Promise<void> {
    await this.currentAddressInput.fill(address);
  }

  async selectState(state: string): Promise<void> {
    const stateInput = this.page.locator('#react-select-3-input');
    await stateInput.fill(state);
    await this.page.keyboard.press('Enter');
  }

  async selectCity(city: string): Promise<void> {
    const cityInput = this.page.locator('#react-select-4-input');
    await cityInput.fill(city);
    await this.page.keyboard.press('Enter');
  }

  async submitForm(): Promise<void> {
    // Scroll submit button into view
    await this.submitButton.scrollIntoViewIfNeeded();
    await this.submitButton.click();
  }

  getSuccessModal(): Locator {
    return this.successModal;
  }
}
