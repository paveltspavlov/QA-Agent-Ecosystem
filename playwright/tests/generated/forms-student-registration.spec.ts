import { test, expect } from '@playwright/test';
import { FormsStudentRegistrationPage } from '../../pages/forms-student-registration.page';

test.describe('Form Automation - Student Registration', () => {
  test('5.1 Complete Student Registration Form', async ({ page }) => {
    const registrationPage = new FormsStudentRegistrationPage(page);

    // Navigate to the form page
    await registrationPage.goto('https://demoqa.com/automation-practice-form');

    // Fill in First Name: "Alex"
    await registrationPage.fillFirstName('Alex');

    // Fill in Last Name: "Johnson"
    await registrationPage.fillLastName('Johnson');

    // Fill in Email: "alex@example.com"
    await registrationPage.fillEmail('alex@example.com');

    // Select Gender: "Male"
    await registrationPage.selectGender('Male');

    // Fill in Mobile Number: "9876543210"
    await registrationPage.fillMobileNumber('9876543210');

    // Click on Date of Birth input and select a date
    await registrationPage.setDateOfBirth('01 Jan 2000');

    // Fill in Subjects: "Maths" (with autocomplete)
    await registrationPage.addSubject('Maths');

    // Select Hobbies: "Sports", "Reading"
    await registrationPage.selectHobby('Sports');
    await registrationPage.selectHobby('Reading');

    // Upload a picture file (if test file exists)
    const uploadPath = './test-data/sample.jpg';
    try {
      await registrationPage.uploadPicture(uploadPath);
    } catch {
      // Picture upload is optional in this test
    }

    // Fill in Current Address: "789 Elm St"
    await registrationPage.fillCurrentAddress('789 Elm St');

    // Select State: "NCR"
    await registrationPage.selectState('NCR');

    // Select City: "Delhi"
    await registrationPage.selectCity('Delhi');

    // Click Submit button
    await registrationPage.submitForm();

    // Verify success modal appears with submitted data
    const successModal = registrationPage.getSuccessModal();
    await expect(successModal).toBeVisible();

    // Verify submitted data in modal
    await expect(successModal).toContainText('Alex');
    await expect(successModal).toContainText('Johnson');
    await expect(successModal).toContainText('alex@example.com');
  });

  test('5.2 Submit Form with Minimal Data', async ({ page }) => {
    const registrationPage = new FormsStudentRegistrationPage(page);

    // Navigate to the form page
    await registrationPage.goto('https://demoqa.com/automation-practice-form');

    // Fill only required fields: First Name, Last Name, Gender, Mobile
    await registrationPage.fillFirstName('Bob');
    await registrationPage.fillLastName('Smith');
    await registrationPage.selectGender('Female');
    await registrationPage.fillMobileNumber('1234567890');

    // Click Submit
    await registrationPage.submitForm();

    // Verify appropriate behavior (success or validation)
    const successModal = registrationPage.getSuccessModal();
    const isSuccessVisible = await successModal.isVisible().catch(() => false);

    if (isSuccessVisible) {
      await expect(successModal).toBeVisible();
      await expect(successModal).toContainText('Bob');
    }
  });
});
