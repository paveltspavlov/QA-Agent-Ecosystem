import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * FormsPage - Tests for the Forms section
 * Includes: Practice Form
 */
export class FormsPage extends BasePage {
  readonly practiceFormLink = this.page.getByRole('link', { name: 'Practice Form' });

  async navigateToPracticeForm() {
    await this.practiceFormLink.click();
  }
}

/**
 * PracticeFormPage - Tests for the Practice Form
 */
export class PracticeFormPage extends BasePage {
  // Form inputs
  readonly firstNameInput = this.page.locator('#firstName');
  readonly lastNameInput = this.page.locator('#lastName');
  readonly emailInput = this.page.locator('#userEmail');
  readonly genderRadioMale = this.page.locator('#gender-radio-1');
  readonly genderRadioFemale = this.page.locator('#gender-radio-2');
  readonly genderRadioOther = this.page.locator('#gender-radio-3');
  readonly mobileNumberInput = this.page.locator('#userNumber');
  readonly dateOfBirthInput = this.page.locator('#dateOfBirthInput');
  readonly subjectsInput = this.page.locator('#subjectsInput');
  readonly hobbyCheckboxSports = this.page.locator('#hobbies-checkbox-1');
  readonly hobbyCheckboxReading = this.page.locator('#hobbies-checkbox-2');
  readonly hobbyCheckboxMusic = this.page.locator('#hobbies-checkbox-3');
  readonly uploadPictureInput = this.page.locator('#uploadPicture');
  readonly currentAddressInput = this.page.locator('#currentAddress');
  readonly stateDropdown = this.page.locator('#state');
  readonly cityDropdown = this.page.locator('#city');
  readonly submitButton = this.page.getByRole('button', { name: 'Submit' });
  readonly successModal = this.page.locator('.modal-content');

  // Helper methods
  async fillFirstName(firstName: string) {
    await this.firstNameInput.fill(firstName);
  }

  async fillLastName(lastName: string) {
    await this.lastNameInput.fill(lastName);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async selectGender(gender: 'Male' | 'Female' | 'Other') {
    if (gender === 'Male') {
      await this.genderRadioMale.click();
    } else if (gender === 'Female') {
      await this.genderRadioFemale.click();
    } else {
      await this.genderRadioOther.click();
    }
  }

  async fillMobileNumber(number: string) {
    await this.mobileNumberInput.fill(number);
  }

  async setDateOfBirth(date: string) {
    await this.dateOfBirthInput.click();
    // Handle date picker if needed
  }

  async selectHobbies(...hobbies: ('Sports' | 'Reading' | 'Music')[]) {
    for (const hobby of hobbies) {
      if (hobby === 'Sports') {
        await this.hobbyCheckboxSports.check();
      } else if (hobby === 'Reading') {
        await this.hobbyCheckboxReading.check();
      } else if (hobby === 'Music') {
        await this.hobbyCheckboxMusic.check();
      }
    }
  }

  async fillCurrentAddress(address: string) {
    await this.currentAddressInput.fill(address);
  }

  async selectState(state: string) {
    await this.stateDropdown.click();
    await this.page.getByText(state, { exact: true }).click();
  }

  async selectCity(city: string) {
    await this.cityDropdown.click();
    await this.page.getByText(city, { exact: true }).click();
  }

  async fillCompleteForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    gender: 'Male' | 'Female' | 'Other';
    mobileNumber: string;
    hobbies?: ('Sports' | 'Reading' | 'Music')[];
    currentAddress: string;
    state: string;
    city: string;
  }) {
    await this.fillFirstName(data.firstName);
    await this.fillLastName(data.lastName);
    await this.fillEmail(data.email);
    await this.selectGender(data.gender);
    await this.fillMobileNumber(data.mobileNumber);
    if (data.hobbies) {
      await this.selectHobbies(...data.hobbies);
    }
    await this.fillCurrentAddress(data.currentAddress);
    await this.selectState(data.state);
    await this.selectCity(data.city);
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async isSuccessModalVisible(): Promise<boolean> {
    return this.successModal.isVisible();
  }

  async scrollToSubmitButton() {
    await this.scrollToElement(this.submitButton);
  }
}

/**
 * TestData - Factory for generating test data
 */
export class TestData {
  static user() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 7);
    const uid = `test-${timestamp}-${random}`;

    return {
      firstName: 'John',
      lastName: 'Doe',
      email: `user-${uid}@test.com`,
      gender: 'Male' as const,
      mobileNumber: '9876543210',
      hobbies: ['Reading', 'Music'] as const,
      currentAddress: '123 Test Street, Test City, TC 12345',
      state: 'NCR',
      city: 'Delhi',
    };
  }

  static users(count: number) {
    return Array.from({ length: count }, () => TestData.user());
  }
}
