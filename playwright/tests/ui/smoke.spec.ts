import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('https://demoqa.com/');
    await expect(page).toHaveTitle(/.+/);
    // Verify page has content loaded
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('navigation links are visible', async ({ page }) => {
    await page.goto('https://demoqa.com/');
    // demoqa.com has links instead of semantic nav element
    const links = page.getByRole('link');
    await expect(links).not.toHaveCount(0);
    const firstLink = links.first();
    await expect(firstLink).toBeVisible();
  });

  test('page has content sections', async ({ page }) => {
    await page.goto('https://demoqa.com/');
    // demoqa.com doesn't have semantic main element, but has heading elements
    const headings = page.getByRole('heading');
    await expect(headings).not.toHaveCount(0);
    const firstHeading = headings.first();
    await expect(firstHeading).toBeVisible();
  });
});
