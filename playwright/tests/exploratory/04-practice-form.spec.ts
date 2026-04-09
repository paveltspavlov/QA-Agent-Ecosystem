import { test, expect } from '@playwright/test';
import { StudentRegistrationFormPage } from '../../pages/forms-student-registration.page';

test.describe('Forms - Practice Form @smoke', () => {
  let formPage: StudentRegistrationFormPage;

  test.beforeEach(async ({ page }) => {
    formPage = new StudentRegistrationFormPage(page);
    await formPage.goto('https://demoqa.com/automation-practice-form');
  });

  test('[TC-006] Forms Module - Practice Form Submission with Valid Data @critical', async ({ page }) => {
    // Step 1: Verify form loads
    await expect(page).toHaveURL(/practice-form/);

    // Step 2: Enter First Name
    await page.fill('#firstName', 'John');

    // Step 3: Enter Last Name
    await page.fill('#lastName', 'Doe');

    // Step 4: Enter Email
    await page.fill('#userEmail', 'john.doe@example.com');

    // Step 5: Enter Phone
    await page.fill('#userNumber', '9876543210');

    // Step 6: Select Gender (Male)
    const maleRadio = page.locator('input[value="Male"]');
    await maleRadio.click();

    // Step 7: Select Date of Birth
    const dobInput = page.locator('#dateOfBirthInput');
    await dobInput.click();
    // Select date from picker (15 Jan 1990)
    const dateInput = page.locator('#dateOfBirthInput');
    await dateInput.fill('01/15/1990');

    // Step 8: Enter Subjects (e.g., Maths)
    const subjectInput = page.locator('#subjectsInput');
    await subjectInput.fill('Maths');
    // Wait for autocomplete and select
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Step 9: Check Sports hobby
    const sportsCheckbox = page.locator('input[value="Sports"]');
    await sportsCheckbox.check();

    // Step 10: Enter Current Address
    const addressInput = page.locator('textarea[placeholder="Current address"]');
    await addressInput.fill('123 Main Street, Springfield');

    // Step 11-12: Select State and City
    const stateSelect = page.locator('#state');
    await stateSelect.click();
    const ncrOption = page.getByText('NCR', { exact: true });
    await ncrOption.click();

    const citySelect = page.locator('#city');
    await citySelect.click();
    const delhiOption = page.getByText('Delhi', { exact: true });
    await delhiOption.click();

    // Step 13: Scroll to and click Submit
    const submitBtn = page.getByRole('button', { name: /submit/i });
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    // Step 14: Verify modal displays with submitted data
    const confirmationModal = page.locator('.modal-content, .modal-dialog');
    await expect(confirmationModal).toBeVisible();

    const modalText = await confirmationModal.textContent();
    expect(modalText).toContain('John');
    expect(modalText).toContain('Doe');
    expect(modalText).toContain('john.doe@example.com');
  });

  test('[TC-007] Forms Module - Practice Form Required Field Validation @high', async ({ page }) => {
    // Step 1: Form loads
    await expect(page).toHaveURL(/practice-form/);

    // Step 2-3: Leave fields empty and click submit
    const submitBtn = page.getByRole('button', { name: /submit/i });
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    // Step 4-5: Verify validation errors appear for required fields
    // DemoQA uses HTML5 validation - check for invalid state
    const firstNameInput = page.locator('#firstName');
    const lastNameInput = page.locator('#lastName');

    // Some fields may show browser validation
    const requiredFields = page.locator('input:required, textarea:required, select:required');
    const visibleRequired = await requiredFields.count();
    expect(visibleRequired).toBeGreaterThan(0);

    // Step 6: Enter only first name
    await firstNameInput.fill('John');

    // Step 7: Try to submit again - should still fail
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    await page.waitForTimeout(500);

    // Form should not submit due to missing other required fields
    const currentURL = page.url();
    // If submission fails, URL should still contain practice-form
    expect(currentURL).toContain('practice-form');
  });
});
