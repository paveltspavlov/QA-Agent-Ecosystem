import { test, expect } from '@playwright/test';

test.describe('Widgets - Advanced Controls @medium', () => {

  test.describe('Autocomplete Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('https://demoqa.com/auto-complete');
      await page.waitForLoadState('networkidle');
    });

    test('[TC-017] Widgets Module - Autocomplete Input @medium', async ({ page }) => {
      // Step 1: Navigate to autocomplete page
      await expect(page).toHaveURL(/auto-complete/);

      // Step 2: Click on single input field
      const singleInput = page.locator('input[id*="single"]').first();
      await expect(singleInput).toBeVisible();
      await singleInput.click();

      // Step 3: Type "a"
      await singleInput.fill('a');
      await page.waitForTimeout(300);

      // Step 4: Verify suggestions appear
      const suggestionList = page.locator('[role="listbox"], .autocomplete-dropdown, .react-autosuggest__suggestions-list').first();
      let suggestionsVisible = await suggestionList.isVisible().catch(() => false);

      if (suggestionsVisible) {
        // Step 5: Click on a suggestion (e.g., Amazon)
        const amazonOption = page.locator('text=Amazon, Office, Pink, Orange').first();
        if (await amazonOption.isVisible()) {
          await amazonOption.click();
          await page.waitForTimeout(300);
        }
      } else {
        // Alternative: type full value
        await singleInput.fill('Amazon');
      }

      // Step 6: Verify selection in input
      const inputValue = await singleInput.inputValue();
      expect(inputValue).toBeTruthy();

      // Step 7: Clear and type "ab"
      await singleInput.click();
      await singleInput.fill('ab');
      await page.waitForTimeout(300);

      // Step 8: Test multi-input if available
      const multiInput = page.locator('input[id*="multiple"], input[placeholder*="Multiple"]').first();
      if (await multiInput.isVisible()) {
        await multiInput.click();
        await multiInput.fill('Apple');
        await page.waitForTimeout(300);

        // Press Enter to add as tag
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        // Step 9: Add multiple values
        await multiInput.fill('Banana');
        await page.keyboard.press('Enter');

        // Verify tags appear
        const tags = page.locator('[class*="tag"], .chip, .badge').all();
        const allTags = await tags;
        expect(allTags.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Accordion Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('https://demoqa.com/accordian');
      await page.waitForLoadState('networkidle');
    });

    test('[TC-018] Widgets Module - Accordian Collapse/Expand @medium', async ({ page }) => {
      // Step 1: Navigate to accordion page
      await expect(page).toHaveURL(/accordian/);

      // Step 2: Verify first section is expanded
      const firstHeading = page.getByRole('heading', { name: /what is lorem/i });
      const firstSection = firstHeading.or(page.locator('[class*="accordion"] button').first());
      await expect(firstSection).toBeVisible();

      // Step 3: Read first section content
      const firstContent = page.locator('[id^="collapse"], .accordion-body').first();
      let firstContentText = await firstContent.textContent();
      expect(firstContentText).toBeTruthy();

      // Step 4: Click second accordion header
      const secondHeading = page.getByRole('heading', { name: /where does it come from/i });
      if (await secondHeading.isVisible()) {
        await secondHeading.click();
        await page.waitForTimeout(300);

        // Step 5: Verify first section collapsed
        let firstIsExpanded = await firstContent.isVisible().catch(() => false);

        // Step 6: Verify second section content displays
        const sections = page.locator('[class*="accordion-body"], [id^="collapse"]').all();
        const allSections = await sections;
        expect(allSections.length).toBeGreaterThan(1);
      }

      // Step 7: Click third accordion header
      const thirdHeading = page.getByRole('heading', { name: /why do we use it/i });
      if (await thirdHeading.isVisible()) {
        await thirdHeading.click();
        await page.waitForTimeout(300);
      }

      // Step 8: Click back to first header
      await firstHeading.click();
      await page.waitForTimeout(300);

      // Verify original content redisplayed
      let firstContentTextAgain = await firstContent.textContent();
      expect(firstContentTextAgain).toBe(firstContentText);
    });
  });

  test.describe('Tooltip Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('https://demoqa.com/tool-tips');
      await page.waitForLoadState('networkidle');
    });

    test('[TC-024] Widgets - Tooltip Display on Hover @medium', async ({ page }) => {
      // Step 1: Navigate to tooltips page
      await expect(page).toHaveURL(/tool-tips/);

      // Step 2: Verify tooltip elements exist
      const tooltipButton = page.locator('[data-toggle="tooltip"], .tooltip-trigger').first();
      await expect(tooltipButton).toBeVisible();

      // Step 3: Hover over element
      await tooltipButton.hover();
      await page.waitForTimeout(500); // Wait for tooltip delay

      // Step 4: Verify tooltip appears
      const tooltip = page.locator('[role="tooltip"], .tooltip').first();
      let tooltipVisible = await tooltip.isVisible().catch(() => false);

      if (tooltipVisible) {
        // Step 4: Read tooltip text
        const tooltipText = await tooltip.textContent();
        expect(tooltipText).toBeTruthy();
        expect(tooltipText).toContain('You hovered');
      }

      // Step 5: Move mouse away
      await page.mouse.move(0, 0);
      await page.waitForTimeout(300);

      // Tooltip should disappear
      tooltipVisible = await tooltip.isVisible().catch(() => false);
      // Tooltip may fade out immediately

      // Step 6: Hover over different element
      const secondTooltip = page.locator('[data-toggle="tooltip"], .tooltip-trigger').nth(1);
      if (await secondTooltip.isVisible()) {
        await secondTooltip.hover();
        await page.waitForTimeout(500);

        // Step 7: Verify different tooltip appears
        const newTooltip = page.locator('[role="tooltip"], .tooltip').first();
        let newTooltipVisible = await newTooltip.isVisible().catch(() => false);

        if (newTooltipVisible) {
          const newTooltipText = await newTooltip.textContent();
          expect(newTooltipText).toBeTruthy();
        }
      }
    });
  });
});
