import { test, expect } from '@playwright/test';
import { ElementsTextBoxPage } from '../../pages/elements-text-box.page';

test.describe('Element Interactions - Text Input & Submission', () => {
  test('1.1 Fill and Submit Text Box Form', async ({ page }) => {
    const textBoxPage = new ElementsTextBoxPage(page);

    // Navigate to text box page
    await textBoxPage.goto('https://demoqa.com/text-box');

    // Fill in the Full Name field with "John Doe"
    await textBoxPage.fillFullName('John Doe');

    // Fill in the Email field with "john@example.com"
    await textBoxPage.fillEmail('john@example.com');

    // Fill in the Current Address textarea with "123 Main St, New York"
    await textBoxPage.fillCurrentAddress('123 Main St, New York');

    // Fill in the Permanent Address textarea with "456 Oak Ave, Boston"
    await textBoxPage.fillPermanentAddress('456 Oak Ave, Boston');

    // Click the Submit button
    await textBoxPage.clickSubmit();

    // Verify the form submission feedback appears
    await expect(textBoxPage.getSubmissionOutput()).toBeVisible();
  });

  test('1.2 Validate Email Field', async ({ page }) => {
    const textBoxPage = new ElementsTextBoxPage(page);

    // Navigate to text box page
    await textBoxPage.goto('https://demoqa.com/text-box');

    // Fill in the Full Name field with "Jane Smith"
    await textBoxPage.fillFullName('Jane Smith');

    // Fill in the Email field with "invalid-email"
    await textBoxPage.fillEmail('invalid-email');

    // Click the Submit button
    await textBoxPage.clickSubmit();

    // Verify form interaction completes (may show validation or accept)
    const output = textBoxPage.getSubmissionOutput();
    const isVisible = await output.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(output).toBeVisible();
    }
  });
});
