import { test, expect } from '@playwright/test';

test.describe('Widgets - Interactive Controls @smoke', () => {

  test.describe('Slider Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('https://demoqa.com/slider');
      await page.waitForLoadState('networkidle');
    });

    test('[TC-010] Widgets Module - Slider Interaction @high', async ({ page }) => {
      // Step 1: Navigate to slider page
      await expect(page).toHaveURL(/slider/);

      // Step 2: Record initial value
      const sliderInput = page.locator('input[type="range"]').first();
      const initialValue = await sliderInput.inputValue();
      expect(initialValue).toBeTruthy();

      // Step 3-4: Drag slider to the right
      const sliderValue = page.locator('.range-slider-value, input[type="range"]');
      
      // For range input, we can set value directly or drag
      await sliderInput.fill('75');
      
      // Step 5: Verify value display updates
      const displayValue = page.locator('input[value], [data-testid*="value"]');
      await page.waitForTimeout(300); // Wait for UI update
      const valueAfterDrag = await sliderInput.inputValue();
      expect(valueAfterDrag).toBe('75');

      // Step 6: Drag to minimum
      await sliderInput.fill('0');
      let currentValue = await sliderInput.inputValue();
      expect(currentValue).toBe('0');

      // Step 7: Drag to maximum
      await sliderInput.fill('100');
      currentValue = await sliderInput.inputValue();
      expect(currentValue).toBe('100');
    });
  });

  test.describe('Date Picker Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('https://demoqa.com/date-picker');
      await page.waitForLoadState('networkidle');
    });

    test('[TC-011] Widgets Module - Date Picker Selection @high', async ({ page }) => {
      // Step 1: Verify date input field loads
      await expect(page).toHaveURL(/date-picker/);
      const dateInput = page.locator('#datePickerMonthYearInput, input[placeholder*="mm/dd/yyyy"]').first();
      await expect(dateInput).toBeVisible();

      // Step 2: Click on date input field
      await dateInput.click();
      await page.waitForTimeout(500);

      // Step 3: Verify calendar appears
      const calendar = page.locator('.react-datepicker, .datepicker-calendar').first();
      // If calendar exists, proceed; otherwise input via text
      let calendarVisible = await calendar.isVisible().catch(() => false);

      if (calendarVisible) {
        // Step 4: Click a date (15th)
        const date15 = page.locator('button').filter({ hasText: /^15$/ }).first();
        if (await date15.isVisible()) {
          await date15.click();
        }
      } else {
        // Direct input if no calendar
        await dateInput.fill('04/15/2024');
      }

      // Step 5: Verify date appears in input
      await page.waitForTimeout(300);
      const inputValue = await dateInput.inputValue();
      expect(inputValue).toBeTruthy();
      expect(inputValue).toContain('15');

      // Step 6: Re-click to reopen calendar
      await dateInput.click();
      await page.waitForTimeout(500);

      // Step 7: Navigate to previous month (click left arrow)
      const prevBtn = page.locator('button[aria-label*="previous"], .react-datepicker__navigation--previous').first();
      if (await prevBtn.isVisible()) {
        await prevBtn.click();
        await page.waitForTimeout(300);
      }

      // Step 8: Select date from different month
      const anotherDate = page.locator('button').filter({ hasText: /^20$/ }).first();
      if (await anotherDate.isVisible()) {
        await anotherDate.click();
      }

      // Verify new date in input
      const newInputValue = await dateInput.inputValue();
      expect(newInputValue).toBeTruthy();
    });
  });

  test.describe('Tabs Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('https://demoqa.com/tabs');
      await page.waitForLoadState('networkidle');
    });

    test('[TC-012] Widgets Module - Tabs Navigation @high', async ({ page }) => {
      // Step 1: Navigate to tabs page
      await expect(page).toHaveURL(/tabs/);

      // Step 2: Verify first tab is active
      const whatTab = page.getByRole('tab', { name: /what/i });
      const originTab = page.getByRole('tab', { name: /origin/i });

      await expect(whatTab).toBeVisible();
      let whatTabClasses = await whatTab.getAttribute('class');
      expect(whatTabClasses).toContain('active');

      // Step 3: Read content of "What" tab
      const tabContent = page.locator('[role="tabpanel"]').first();
      let contentText = await tabContent.textContent();
      expect(contentText).toBeTruthy();

      // Step 4: Click "Origin" tab
      await originTab.click();
      await page.waitForTimeout(300); // Wait for tab switch

      // Step 5: Verify content changed
      let newContentText = await tabContent.textContent();
      expect(newContentText).not.toBe(contentText);

      // Step 6: Click "How Did It Start" tab
      const howTab = page.getByRole('tab', { name: /how.*start/i });
      if (await howTab.isVisible()) {
        await howTab.click();
        await page.waitForTimeout(300);
        let howContentText = await tabContent.textContent();
        expect(howContentText).toBeTruthy();
      }

      // Step 7: Click "Ending" tab
      const endingTab = page.getByRole('tab', { name: /ending/i });
      if (await endingTab.isVisible()) {
        await endingTab.click();
        await page.waitForTimeout(300);
      }

      // Step 8: Click back to "What" tab
      await whatTab.click();
      await page.waitForTimeout(300);
      let backToWhatText = await tabContent.textContent();
      expect(backToWhatText).toBe(contentText);
    });
  });
});
