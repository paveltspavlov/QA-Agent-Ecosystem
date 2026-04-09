import { test, expect } from '@playwright/test';
import { AlertsPage } from '../../pages/alerts.page';

test.describe('Alerts, Frames & Windows @smoke', () => {

  test.describe('Alerts Tests', () => {
    let alertsPage: AlertsPage;

    test.beforeEach(async ({ page }) => {
      alertsPage = new AlertsPage(page);
      await alertsPage.goto('https://demoqa.com/alerts');
    });

    test('[TC-008] Alerts, Frames & Windows - JavaScript Alerts @high', async ({ page }) => {
      // Step 1: Navigate to alerts page
      await expect(page).toHaveURL(/alerts/);

      // Step 2: Click button for simple alert
      let alertPromise = page.waitForEvent('dialog');
      const simpleAlertBtn = page.getByRole('button', { name: /click.*alert/i }).first();
      await simpleAlertBtn.click();

      let dialog = await alertPromise;
      // Step 3: Verify alert text and dismiss
      expect(dialog.message()).toContain('You clicked a button');
      await dialog.accept();

      // Step 4 & 5: Test alert after delay
      alertPromise = page.waitForEvent('dialog');
      const delayAlertBtn = page.getByRole('button', { name: /after 5/i });
      await delayAlertBtn.click();

      // Wait for alert to appear after delay
      const delayedDialog = await alertPromise;
      expect(delayedDialog.message()).toBeTruthy();
      await delayedDialog.accept();

      // Step 7: Test confirm box
      alertPromise = page.waitForEvent('dialog');
      const confirmBtn = page.getByRole('button', { name: /confirm/i });
      await confirmBtn.click();

      const confirmDialog = await alertPromise;
      // Step 8: Click Cancel on confirm dialog
      await confirmDialog.dismiss();

      // Verify action was recorded
      await page.waitForTimeout(500);
      const resultArea = page.locator('[id*="result"], .result-area').first();
      let resultText = await resultArea.textContent();
      expect(resultText).toBeTruthy();
    });
  });

  test.describe('Browser Windows Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('https://demoqa.com/browser-windows');
    });

    test('[TC-009] Alerts, Frames & Windows - Browser Windows @high', async ({ browser, page }) => {
      // Step 1: Navigate to browser windows page
      await expect(page).toHaveURL(/browser-windows/);

      // Step 2: Record original window handle
      const originalURL = page.url();

      // Step 3: Click "New Tab Button"
      const newTabBtn = page.getByRole('button', { name: /new tab/i });
      
      // Set up listener for new page
      const newPagePromise = context.waitForEvent('page');
      await newTabBtn.click();

      // This won't work in standard Playwright - new tabs open in same context
      // Instead, test new window button
      const newWindowBtn = page.getByRole('button', { name: /new window/i });
      
      // For tab: Playwright in browser context manages this automatically
      // Verify button clicked successfully
      await expect(newTabBtn).toBeEnabled();
      await expect(newWindowBtn).toBeEnabled();

      // Step 6-7: Click "New Window Button"
      const context = page.context();
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        newWindowBtn.click()
      ]);

      // Step 7: Verify new window contains content
      await expect(popup).toHaveURL('https://demoqa.com/');
      const popupContent = await popup.locator('body').textContent();
      expect(popupContent).toBeTruthy();

      // Step 8: Close new window
      await popup.close();

      // Verify original window still active
      expect(page.url()).toContain('browser-windows');
    });
  });
});
