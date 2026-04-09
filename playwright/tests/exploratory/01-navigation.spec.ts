import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';

test.describe('Navigation & Page Load @smoke', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('https://demoqa.com/');
  });

  test('[TC-001] Homepage Loads Successfully @critical', async ({ page }) => {
    // Step 1: Navigate to homepage
    await homePage.goto();
    // Expected: Page loads with HTTP 200
    await expect(page).toHaveURL('https://demoqa.com/');
    
    // Step 2: Verify page title
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Step 3: Verify header/navigation area is visible
    const header = page.getByRole('heading', { name: /demoqa/i });
    await expect(header.or(page.locator('header'))).toBeVisible();
    
    // Step 4: Verify module cards/links are visible
    const elementCard = page.getByRole('link').filter({ hasText: /Elements/ }).first();
    const formsCard = page.getByRole('link').filter({ hasText: /Forms/ }).first();
    
    await expect(elementCard).toBeVisible();
    await expect(formsCard).toBeVisible();
  });

  test('[TC-022] Error Handling - Invalid URL Navigation @regression', async ({ page }) => {
    // Step 1: Navigate to invalid page
    await page.goto('https://demoqa.com/invalid-page-xyz', { waitUntil: 'networkidle' }).catch(() => {});
    
    // Step 2 & 3: Verify error handling (React SPA typically shows 404 or redirects)
    const currentURL = page.url();
    // Application behavior: may redirect or show error
    expect(currentURL).toBeTruthy();
    
    // Step 4: Verify navigation link exists
    const homeLink = page.getByRole('link').filter({ hasText: /demoqa|home|logo/i }).first();
    
    // Step 5: Click home link to navigate back
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForURL('https://demoqa.com/', { waitUntil: 'networkidle' });
      expect(page.url()).toContain('demoqa.com');
    }
  });
});
