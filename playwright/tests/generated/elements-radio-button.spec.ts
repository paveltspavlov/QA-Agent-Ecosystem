import { test, expect } from '@playwright/test';
import { ElementsRadioButtonPage } from '../../pages/elements-radio-button.page';

test.describe('Element Interactions - Radio Buttons', () => {
  test('3.1 Select Radio Button Options', async ({ page }) => {
    const radioButtonPage = new ElementsRadioButtonPage(page);
    await radioButtonPage.goto('https://demoqa.com/radio-button');

    await test.step('Verify radio buttons have correct roles', async () => {
      const yesButton = radioButtonPage.getRadioButton('Yes');
      await expect(yesButton).toBeVisible();
      await expect(yesButton).toHaveRole('radio');
    });

    await test.step('Select "Yes" and verify checked state', async () => {
      await radioButtonPage.selectOption('Yes');
      await expect(radioButtonPage.getRadioButton('Yes')).toBeChecked();
    });

    await test.step('Select "No" and verify mutual exclusion', async () => {
      await radioButtonPage.selectOption('No');
      await expect(radioButtonPage.getRadioButton('No')).toBeChecked();
      await expect(radioButtonPage.getRadioButton('Yes')).not.toBeChecked();
    });
  });
});
