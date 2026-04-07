import { test, expect } from '@playwright/test';
import { ElementsDynamicPropertiesPage } from '../../pages/elements-dynamic-properties.page';

test.describe('Dynamic Properties', () => {
  test.fixme('14.1 Verify Dynamic Button Enable/Disable', async ({ page }) => {
    const dynamicPage = new ElementsDynamicPropertiesPage(page);
    await dynamicPage.goto('https://demoqa.com/dynamic-properties');

    await test.step('Verify button is initially disabled', async () => {
      const enableButton = dynamicPage.getWillEnableButton();
      await expect(enableButton).toBeDisabled();
      await expect(enableButton).toHaveRole('button');
    });

    await test.step('Wait for button to become enabled (auto-polling)', async () => {
      const enableButton = dynamicPage.getWillEnableButton();
      // Use Playwright's auto-retrying assertion instead of waitForTimeout
      await expect(enableButton).toBeEnabled({ timeout: 10_000 });
    });

    await test.step('Click enabled button and verify response', async () => {
      const enableButton = dynamicPage.getWillEnableButton();
      await enableButton.click();
      const response = dynamicPage.getButtonResponse();
      await expect(response).toBeVisible();
    });
  });
});
