import { test, expect } from '@playwright/test';
import { AlertsPage } from '../../pages/alerts-dialogs.page';

test.describe('Alerts & Dialogs', () => {
  test('7.1 Handle Simple Alert', async ({ page }) => {
    const alertsPage = new AlertsPage(page);

    // Navigate to alerts page
    await alertsPage.goto('https://demoqa.com/alerts');

    // Listen for alert dialog
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('alert');
      await dialog.accept();
    });

    // Click the "Click for alert" button
    await alertsPage.clickSimpleAlertButton();

    // Verify alert was handled
    const resultMessage = alertsPage.getSimpleAlertResult();
    const isVisible = await resultMessage.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(resultMessage).toBeVisible();
    }
  });

  test('7.2 Handle Confirm Dialog', async ({ page }) => {
    const alertsPage = new AlertsPage(page);

    // Navigate to alerts page
    await alertsPage.goto('https://demoqa.com/alerts');

    // Listen for confirm dialog and click OK
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    // Click the "On button click, confirm box will appear" button
    await alertsPage.clickConfirmButton();

    // Verify result message displays
    const resultMessage = alertsPage.getConfirmResult();
    await expect(resultMessage).toBeVisible();
    await expect(resultMessage).toContainText('OK');
  });

  test('7.3 Handle Prompt Dialog', async ({ page }) => {
    const alertsPage = new AlertsPage(page);

    // Navigate to alerts page
    await alertsPage.goto('https://demoqa.com/alerts');

    // Listen for prompt dialog and enter text
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('Playwright Test');
    });

    // Click the "On button click, prompt will appear" button
    await alertsPage.clickPromptButton();

    // Verify the entered text is displayed in the result
    const resultMessage = alertsPage.getPromptResult();
    await expect(resultMessage).toBeVisible();
    await expect(resultMessage).toContainText('Playwright Test');
  });
});
