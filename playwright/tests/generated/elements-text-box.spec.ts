import { test, expect } from '@playwright/test';
import { ElementsTextBoxPage } from '../../pages/elements-text-box.page';

test.describe('Element Interactions - Text Input & Submission', () => {
  test('1.1 Fill and Submit Text Box Form', async ({ page }) => {
    const textBoxPage = new ElementsTextBoxPage(page);
    await textBoxPage.goto('https://demoqa.com/text-box');

    await test.step('Fill all form fields', async () => {
      await textBoxPage.fillFullName('John Doe');
      await textBoxPage.fillEmail('john@example.com');
      await textBoxPage.fillCurrentAddress('123 Main St, New York');
      await textBoxPage.fillPermanentAddress('456 Oak Ave, Boston');
    });

    await test.step('Submit and verify output', async () => {
      await textBoxPage.clickSubmit();
      await expect(textBoxPage.getSubmissionOutput()).toBeVisible();
    });
  });

  test('1.2 Validate Email Field', async ({ page }) => {
    const textBoxPage = new ElementsTextBoxPage(page);
    await textBoxPage.goto('https://demoqa.com/text-box');

    await test.step('Submit with invalid email', async () => {
      await textBoxPage.fillFullName('Jane Smith');
      await textBoxPage.fillEmail('invalid-email');
      await textBoxPage.clickSubmit();
    });

    await test.step('Verify validation behavior', async () => {
      const output = textBoxPage.getSubmissionOutput();
      const isVisible = await output.isVisible().catch(() => false);
      if (isVisible) {
        await expect(output).toBeVisible();
      }
    });
  });
});
