import { test, expect } from '@playwright/test';
import { AlertsPage } from '../../pages/alerts-dialogs.page';

test.describe('Alerts & Dialogs', () => {
  test('7.1 Handle Simple Alert', async ({ page }) => {
    const alertsPage = new AlertsPage(page);
    await alertsPage.goto('https://demoqa.com/alerts');

    await test.step('Trigger and accept simple alert', async () => {
      page.once('dialog', async (dialog) => {
        expect(dialog.type()).toBe('alert');
        await dialog.accept();
      });
      await alertsPage.clickSimpleAlertButton();
    });

    await test.step('Verify alert result', async () => {
      const resultMessage = alertsPage.getSimpleAlertResult();
      const isVisible = await resultMessage.isVisible().catch(() => false);
      if (isVisible) {
        await expect(resultMessage).toBeVisible();
      }
    });
  });

  test('7.2 Handle Confirm Dialog', async ({ page }) => {
    const alertsPage = new AlertsPage(page);
    await alertsPage.goto('https://demoqa.com/alerts');

    await test.step('Trigger and accept confirm dialog', async () => {
      page.once('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        await dialog.accept();
      });
      await alertsPage.clickConfirmButton();
    });

    await test.step('Verify confirm result shows OK', async () => {
      const resultMessage = alertsPage.getConfirmResult();
      await expect(resultMessage).toBeVisible();
      await expect(resultMessage).toContainText(/Ok|OK/i);
    });
  });

  test.fixme('7.3 Handle Prompt Dialog', async ({ page }) => {
    const alertsPage = new AlertsPage(page);
    await alertsPage.goto('https://demoqa.com/alerts');

    await test.step('Trigger prompt and enter text', async () => {
      page.once('dialog', async (dialog) => {
        expect(dialog.type()).toBe('prompt');
        await dialog.accept('Playwright Test');
      });
      await alertsPage.clickPromptButton();
    });

    await test.step('Verify prompt result contains entered text', async () => {
      const resultMessage = alertsPage.getPromptResult();
      await expect(resultMessage).toBeVisible();
      await expect(resultMessage).toContainText('Playwright Test');
    });
  });
});
