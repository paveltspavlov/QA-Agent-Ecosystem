import { test, expect } from '@playwright/test';
import { ElementsLinksPage } from '../../pages/elements-links.page';

test.describe('Links & Navigation', () => {
  test('9.1 Navigate via Link', async ({ page }) => {
    const linksPage = new ElementsLinksPage(page);
    await linksPage.goto('https://demoqa.com/links');

    const initialUrl = page.url();

    await test.step('Click Home link and verify navigation', async () => {
      await linksPage.clickLink('Home');
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).not.toBe(initialUrl);
    });

    await test.step('Navigate back and verify return to links page', async () => {
      await page.goBack();
      await expect(page).toHaveURL(/.*links/);
    });
  });
});
