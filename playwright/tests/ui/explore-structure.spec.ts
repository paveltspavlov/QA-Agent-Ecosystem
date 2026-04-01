import { test } from '@playwright/test';

test('explore page structure', async ({ page }) => {
  await page.goto('https://demoqa.com/');
  
  // Log all roles available on the page
  console.log('\n=== ROLES AVAILABLE ===');
  const roles = ['navigation', 'main', 'heading', 'link', 'button', 'contentinfo'];
  
  for (const role of roles) {
    try {
      const locator = page.getByRole(role as any);
      const count = await locator.count();
      console.log(`Role "${role}": ${count} elements`);
    } catch (e) {
      console.log(`Role "${role}": error checking`);
    }
  }
  
  // Get all headings
  const headings = await page.locator('h1, h2, h3').all();
  console.log(`\nTotal headings (h1-h3): ${headings.length}`);
  
  // Get all links
  const links = await page.getByRole('link').all();
  console.log(`Total links: ${links.length}`);
  
  // Get all buttons
  const buttons = await page.getByRole('button').all();
  console.log(`Total buttons: ${buttons.length}`);
  
  // Get page title
  const title = await page.title();
  console.log(`\nPage title: ${title}`);
});
