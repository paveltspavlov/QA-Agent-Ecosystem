import { test, expect } from '@playwright/test';
import { AlertsBrowserWindowsPage } from '../../pages/alerts-browser-windows.page';

test.describe('Browser Window Interactions', () => {
  test('8.1 New Window/Tab Handling', async ({ page, context }) => {
    const browserWindowsPage = new AlertsBrowserWindowsPage(page);

    // Navigate to browser windows page
    await browserWindowsPage.goto('https://demoqa.com/browser-windows');

    // Set up listener for new page/window
    const newPagePromise = context.waitForEvent('page');

    // Click the "New Window" button
    await browserWindowsPage.clickNewWindowButton();

    // Wait for new window/tab to open
    const newWindow = await newPagePromise;

    // Verify new window URL
    await expect(newWindow).toHaveURL(/.*demoqa.com/);

    // Close new window
    await newWindow.close();

    // Verify focus returns to original window
    await expect(page).toHaveURL(/.*browser-windows/);
  });
});
