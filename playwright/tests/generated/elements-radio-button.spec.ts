import { test, expect } from '@playwright/test';
import { ElementsRadioButtonPage } from '../../pages/elements-radio-button.page';

test.describe('Element Interactions - Radio Buttons', () => {
  test('3.1 Select Radio Button Options', async ({ page }) => {
    const radioButtonPage = new ElementsRadioButtonPage(page);

    // Navigate to radio button page
    await radioButtonPage.goto('https://demoqa.com/radio-button');

    // Verify radio buttons are visible
    const yesButton = radioButtonPage.getRadioButton('Yes');
    await expect(yesButton).toBeVisible();

    // Click on the first radio button (Yes)
    await radioButtonPage.selectOption('Yes');

    // Verify the button is selected
    await expect(radioButtonPage.getRadioButton('Yes')).toBeChecked();

    // Click on another radio button (No)
    await radioButtonPage.selectOption('No');

    // Verify only the new button is selected
    await expect(radioButtonPage.getRadioButton('No')).toBeChecked();
    await expect(radioButtonPage.getRadioButton('Yes')).not.toBeChecked();
  });
});
