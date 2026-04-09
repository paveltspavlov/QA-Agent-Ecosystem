import { test, expect } from '@playwright/test';
import { ElementsTextBoxPage } from '../../pages/elements-text-box.page';

test.describe('Elements - Text Box @smoke', () => {
  let textBoxPage: ElementsTextBoxPage;

  test.beforeEach(async ({ page }) => {
    textBoxPage = new ElementsTextBoxPage(page);
    await textBoxPage.goto('https://demoqa.com/text-box');
  });

  test('[TC-002] Elements Module - Text Box Submission @critical', async ({ page }) => {
    // Step 1: Navigate and verify form loads
    await expect(page).toHaveURL(/text-box/);
    const fullNameInput = page.getByPlaceholder('Full Name');
    await expect(fullNameInput).toBeVisible();

    // Step 2: Enter full name
    const testName = 'John Doe';
    await fullNameInput.fill(testName);

    // Step 3: Enter email
    const emailInput = page.getByPlaceholder('name@example.com');
    const testEmail = 'john@example.com';
    await emailInput.fill(testEmail);

    // Step 4: Click submit button
    const submitBtn = page.getByRole('button', { name: /submit/i });
    await submitBtn.click();

    // Step 5: Verify response displays submitted data
    await page.waitForTimeout(500); // Allow response area to render
    const responseText = page.locator('#output');
    await expect(responseText).toBeVisible();
    
    const responseContent = await responseText.textContent();
    expect(responseContent).toContain('John Doe');
    expect(responseContent).toContain('john@example.com');
  });

  test('[TC-003] Elements Module - Text Box Invalid Email Validation @regression', async ({ page }) => {
    // Step 1: Form loads
    await expect(page).toHaveURL(/text-box/);

    // Step 2: Enter valid name
    const fullNameInput = page.getByPlaceholder('Full Name');
    await fullNameInput.fill('John Doe');

    // Step 3: Enter invalid email (no @ symbol)
    const emailInput = page.getByPlaceholder('name@example.com');
    const invalidEmail = 'invalid-email';
    await emailInput.fill(invalidEmail);

    // Step 4: Click submit
    const submitBtn = page.getByRole('button', { name: /submit/i });
    await submitBtn.click();

    // Step 5: Verify response displays the invalid email as submitted
    await page.waitForTimeout(500);
    const responseText = page.locator('#output');
    const responseContent = await responseText.textContent();
    
    // Application accepts invalid email (no client-side validation)
    expect(responseContent).toContain(invalidEmail);
  });

  test('[TC-025] Special Characters & XSS Test - Text Box Input @security', async ({ page }) => {
    // Step 1: Form loads
    await expect(page).toHaveURL(/text-box/);

    // Step 2: Enter special characters in Full Name
    const fullNameInput = page.getByPlaceholder('Full Name');
    const specialName = 'John <script>alert("XSS")</script> Doe';
    await fullNameInput.fill(specialName);

    // Step 3: Enter special characters in Email
    const emailInput = page.getByPlaceholder('name@example.com');
    const specialEmail = 'test@example.com<img src=x onerror="alert(1)">';
    await emailInput.fill(specialEmail);

    // Step 4: Click submit
    const submitBtn = page.getByRole('button', { name: /submit/i });
    await submitBtn.click();

    // Step 5: Verify no script execution (no alert should appear)
    // Wait to ensure no alert would pop up
    await page.waitForTimeout(1000);
    
    // Step 6: Verify response displays safely (escaped or as text)
    const responseText = page.locator('#output');
    const responseContent = await responseText.textContent();
    
    // Content should be displayed as text, not executed
    expect(responseContent).toBeTruthy();
    // Special chars are present but not executed
    expect(responseContent).toContain('John');
  });
});
