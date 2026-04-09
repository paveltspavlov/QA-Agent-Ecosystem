import { test, expect } from '@playwright/test';

test.describe('Advanced Features - Frames & Dynamic Content @high', () => {

  test.describe('Frames Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('https://demoqa.com/frames');
      await page.waitForLoadState('networkidle');
    });

    test('[TC-019] Frames Module - Iframe Content Interaction @high', async ({ page }) => {
      // Step 1: Navigate to frames page
      await expect(page).toHaveURL(/frames/);

      // Step 2: Verify iframes are visible
      const iframes = page.locator('iframe');
      const iframeCount = await iframes.count();
      expect(iframeCount).toBeGreaterThan(0);

      // Step 3: Verify page content outside iframe
      const pageContent = page.locator('body').first();
      const pageText = await pageContent.textContent();
      expect(pageText).toBeTruthy();

      // Step 4: Locate first iframe
      const firstIframe = page.frameLocator('iframe').first();
      
      // Step 5: Switch focus to first iframe
      // Step 6: Interact with iframe content
      const iframeHeading = firstIframe.getByRole('heading').first();
      let headingVisible = await iframeHeading.isVisible().catch(() => false);

      if (headingVisible) {
        const headingText = await iframeHeading.textContent();
        expect(headingText).toBeTruthy();
      }

      // Step 7: Switch focus back to main page
      const mainPageContent = page.locator('body');
      const mainText = await mainPageContent.textContent();
      expect(mainText).toBe(pageText);

      // Step 8: Verify second iframe (if exists)
      const secondIframe = page.frameLocator('iframe').nth(1);
      let secondIframeContent = await secondIframe.locator('body').textContent().catch(() => '');
      expect(secondIframeContent).toBeTruthy();
    });
  });

  test.describe('Dynamic Properties Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('https://demoqa.com/dynamic/properties');
      await page.waitForLoadState('networkidle');
    });

    test('[TC-020] Dynamic Wait Module - Dynamic Properties @medium', async ({ page }) => {
      // Step 1: Navigate to dynamic properties page
      await expect(page).toHaveURL(/dynamic.properties/);

      // Step 2: Verify button is initially disabled
      const button = page.getByRole('button', { name: /enable/i }).or(page.locator('button').first());
      
      // Check if button is disabled
      let isDisabled = await button.isDisabled();
      expect(isDisabled).toBe(true);

      // Step 3: Wait for button to enable
      // DemoQA typically waits ~5 seconds
      const startTime = Date.now();
      
      // Step 4: Wait up to 10 seconds for button to become enabled
      await page.waitForTimeout(100); // Initial wait
      let buttonEnabled = false;
      
      for (let i = 0; i < 100; i++) {
        isDisabled = await button.isDisabled();
        if (!isDisabled) {
          buttonEnabled = true;
          break;
        }
        await page.waitForTimeout(100);
      }

      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeLessThan(10000); // Should enable within 10 seconds

      // Step 5: Verify button becomes enabled
      expect(buttonEnabled).toBe(true);

      // Step 6: Click the now-enabled button
      await button.click();

      // Step 6: Verify result displays
      await page.waitForTimeout(500);
      const resultArea = page.locator('[id*="result"], .result-text, .success').first();
      let resultVisible = await resultArea.isVisible().catch(() => false);

      if (resultVisible) {
        const resultText = await resultArea.textContent();
        expect(resultText).toBeTruthy();
      }
    });
  });

  test.describe('Responsive & Edge Cases Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('https://demoqa.com/');
      await page.waitForLoadState('networkidle');
    });

    test('[TC-021] Mobile Responsiveness - Homepage on Mobile Viewport @medium', async ({ page }) => {
      // Step 1: Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Step 2: Navigate to homepage
      await page.goto('https://demoqa.com/');
      await page.waitForLoadState('networkidle');

      // Step 3: Verify header visible at mobile width
      const header = page.getByRole('heading').first().or(page.locator('header').first());
      await expect(header).toBeVisible();

      // Step 4: Verify navigation accessible
      const navMenu = page.locator('nav, [class*="menu"], [class*="header"]').first();
      let navVisible = await navMenu.isVisible().catch(() => false);

      // Step 5: Verify module cards visible
      const cards = page.locator('[class*="card"], [class*="module"], a[href*="/"]').all();
      const allCards = await cards;
      expect(allCards.length).toBeGreaterThan(3);

      // Step 6: Scroll down - no horizontal scroll required
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance

      // Step 7: Verify images scale appropriately
      const images = page.locator('img').all();
      const allImages = await images;
      
      for (const img of allImages) {
        const size = await img.boundingBox();
        if (size && size.width > 0 && size.height > 0) {
          // Images should fit within viewport
          expect(size.width).toBeLessThanOrEqual(375 + 10); // Small tolerance
        }
      }
    });

    test('[TC-023] Forms - Phone Number Boundary Testing @medium', async ({ page }) => {
      // Navigate to practice form or text box
      await page.goto('https://demoqa.com/practice-form');
      await page.waitForLoadState('networkidle');

      const phoneInput = page.locator('#userNumber, input[type="tel"]').first();

      if (await phoneInput.isVisible()) {
        // Test with 9 digits
        await phoneInput.fill('987654321');
        let value = await phoneInput.inputValue();
        expect(value).toBe('987654321');

        // Test with 10 digits
        await phoneInput.fill('9876543210');
        value = await phoneInput.inputValue();
        expect(value).toBe('9876543210');

        // Test with 11 digits
        await phoneInput.fill('98765432101');
        value = await phoneInput.inputValue();
        expect(value).toBe('98765432101');

        // Test with format
        await phoneInput.fill('987-654-3210');
        value = await phoneInput.inputValue();
        expect(value).toBeTruthy();

        // Test with letters (may be sanitized)
        await phoneInput.fill('98A7654321');
        value = await phoneInput.inputValue();
        expect(value).toBeTruthy(); // May be sanitized to numbers only

        // Test empty field
        await phoneInput.fill('');
        value = await phoneInput.inputValue();
        expect(value).toBe('');
      }
    });
  });
});
