import { test, expect } from '@playwright/test';
import { ElementsDynamicPropertiesPage } from '../../pages/elements-dynamic-properties.page';

test.describe('Dynamic Properties', () => {
  test('14.1 Verify Dynamic Button Enable/Disable', async ({ page }) => {
    const dynamicPage = new ElementsDynamicPropertiesPage(page);

    // Navigate to dynamic properties page
    await dynamicPage.goto('https://demoqa.com/dynamic-properties');

    // Verify "Will enable 5 seconds" button is initially disabled
    const enableButton = dynamicPage.getWillEnableButton();
    await expect(enableButton).toBeDisabled();

    // Wait for 6 seconds for button to become enabled
    await page.waitForTimeout(6000);

    // Verify button becomes enabled
    await expect(enableButton).toBeEnabled();

    // Click the button
    await enableButton.click();

    // Verify button click response
    const response = dynamicPage.getButtonResponse();
    await expect(response).toBeVisible();
  });
});
