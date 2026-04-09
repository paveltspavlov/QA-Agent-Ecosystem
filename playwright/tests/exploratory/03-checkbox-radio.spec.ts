import { test, expect } from '@playwright/test';
import { ElementsCheckboxPage } from '../../pages/elements-checkbox.page';
import { ElementsRadioButtonPage } from '../../pages/elements-radio-button.page';

test.describe('Elements - Checkbox & Radio Buttons @smoke', () => {

  test.describe('Checkbox Tests', () => {
    let checkBoxPage: ElementsCheckboxPage;

    test.beforeEach(async ({ page }) => {
      checkBoxPage = new ElementsCheckboxPage(page);
      await checkBoxPage.goto('https://demoqa.com/checkbox');
    });

    test('[TC-004] Elements Module - CheckBox Nested Selection @high', async ({ page }) => {
      // Step 1: Navigate to checkbox page
      await expect(page).toHaveURL(/checkbox/);

      // Step 2: Verify root checkbox "Home" is visible with expand icon
      const homeToggle = page.locator('button[title="Toggle"]').first();
      await expect(homeToggle).toBeVisible();

      // Step 3: Click expand icon to show children
      await homeToggle.click();
      await page.waitForTimeout(300); // Wait for animation

      // Step 4: Check the "Desktop" checkbox
      const desktopCheckbox = page.locator('input[value="desktop"]');
      await expect(desktopCheckbox).toBeVisible();
      await desktopCheckbox.check();

      // Step 5: Verify result list shows "desktop"
      const resultList = page.locator('.display-result');
      let resultText = await resultList.textContent();
      expect(resultText).toContain('desktop');

      // Step 6: Uncheck the "Desktop" checkbox
      await desktopCheckbox.uncheck();

      // Verify "desktop" removed from results
      resultText = await resultList.textContent();
      expect(resultText).not.toContain('desktop');
    });
  });

  test.describe('Radio Button Tests', () => {
    let radioButtonPage: ElementsRadioButtonPage;

    test.beforeEach(async ({ page }) => {
      radioButtonPage = new ElementsRadioButtonPage(page);
      await radioButtonPage.goto('https://demoqa.com/radio-button');
    });

    test('[TC-005] Elements Module - Radio Button Single Selection @high', async ({ page }) => {
      // Step 1: Navigate and verify radio buttons load
      await expect(page).toHaveURL(/radio-button/);
      
      // Step 2: Verify "Yes" radio button is visible and not selected
      const yesRadio = page.locator('input[value="Yes"]');
      await expect(yesRadio).toBeVisible();
      
      // Step 3: Click "Yes" radio button
      await yesRadio.click();
      
      // Verify it's selected (checked)
      await expect(yesRadio).toBeChecked();

      // Step 4: Verify result message displays
      const resultMessage = page.locator('.mt-3'); // Result message area
      let messageText = await resultMessage.textContent();
      expect(messageText).toContain('You have selected');

      // Step 5: Click "Impressive" radio button
      const impressiveRadio = page.locator('input[value="Impressive"]');
      await impressiveRadio.click();

      // Verify "Impressive" is selected and "Yes" is deselected
      await expect(impressiveRadio).toBeChecked();
      await expect(yesRadio).not.toBeChecked();

      // Verify result updates
      messageText = await resultMessage.textContent();
      expect(messageText).toContain('Impressive');
    });
  });
});
