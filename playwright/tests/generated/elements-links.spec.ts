import { test, expect } from '@playwright/test';
import { ElementsLinksPage } from '../../pages/elements-links.page';

test.describe('Links & Navigation', () => {
  test('9.1 Navigate via Link', async ({ page }) => {
    const linksPage = new ElementsLinksPage(page);

    // Navigate to links page
    await linksPage.goto('https://demoqa.com/links');

    // Get initial URL
    const initialUrl = page.url();

    // Click on a link (e.g., "Home")
    await linksPage.clickLink('Home');

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Verify navigation to the target URL
    const afterClickUrl = page.url();
    expect(afterClickUrl).not.toBe(initialUrl);

    // Navigate back
    await page.goBack();

    // Verify return to links page
    await expect(page).toHaveURL(/.*links/);
  });
});
