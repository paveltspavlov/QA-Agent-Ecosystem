import { test, expect } from '@playwright/test';
import { AlertsBrowserWindowsPage } from '../../pages/alerts-browser-windows.page';

test.describe('Browser Window Interactions', () => {
  test('8.1 New Window/Tab Handling', async ({ page, context }) => {
    const browserWindowsPage = new AlertsBrowserWindowsPage(page);
    await browserWindowsPage.goto('https://demoqa.com/browser-windows');

    await test.step('Open new window and verify URL', async () => {
      const newPagePromise = context.waitForEvent('page');
      await browserWindowsPage.clickNewWindowButton();
      const newWindow = await newPagePromise;
      await expect(newWindow).toHaveURL(/.*demoqa.com/);
      await newWindow.close();
    });

    await test.step('Verify original window is intact', async () => {
      await expect(page).toHaveURL(/.*browser-windows/);
    });
  });
});
