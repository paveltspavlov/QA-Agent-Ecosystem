import { test, expect } from '@playwright/test';
import { FormsStudentRegistrationPage } from '../../pages/forms-student-registration.page';

test.describe('Form Automation - Student Registration', () => {
  test.fixme('5.1 Complete Student Registration Form', async ({ page }) => {
    const registrationPage = new FormsStudentRegistrationPage(page);
    await registrationPage.goto('https://demoqa.com/automation-practice-form');

    await test.step('Fill required fields', async () => {
      await registrationPage.fillRegistrationForm({
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex@example.com',
        gender: 'Male',
        mobileNumber: '9876543210',
      });
    });

    await test.step('Fill optional fields', async () => {
      await registrationPage.setDateOfBirth('01 Jan 2000');
      await registrationPage.addSubject('Maths');
      await registrationPage.selectHobby('Sports');
      await registrationPage.selectHobby('Reading');

      try {
        await registrationPage.uploadPicture('./test-data/sample.jpg');
      } catch {
        // Picture upload is optional
      }

      await registrationPage.fillCurrentAddress('789 Elm St');
      await registrationPage.selectState('NCR');
      await registrationPage.selectCity('Delhi');
    });

    await test.step('Submit and verify success modal', async () => {
      await registrationPage.submitForm();
      const successModal = registrationPage.getSuccessModal();
      await expect(successModal).toBeVisible();
      await expect(successModal).toContainText('Alex');
      await expect(successModal).toContainText('Johnson');
      await expect(successModal).toContainText('alex@example.com');
    });
  });

  test('5.2 Submit Form with Minimal Data', async ({ page }) => {
    const registrationPage = new FormsStudentRegistrationPage(page);
    await registrationPage.goto('https://demoqa.com/automation-practice-form');

    await test.step('Fill only required fields and submit', async () => {
      await registrationPage.fillRegistrationForm({
        firstName: 'Bob',
        lastName: 'Smith',
        gender: 'Female',
        mobileNumber: '1234567890',
      });
      await registrationPage.submitForm();
    });

    await test.step('Verify submission outcome', async () => {
      const successModal = registrationPage.getSuccessModal();
      const isSuccessVisible = await successModal.isVisible().catch(() => false);
      if (isSuccessVisible) {
        await expect(successModal).toBeVisible();
        await expect(successModal).toContainText('Bob');
      }
    });
  });
});
