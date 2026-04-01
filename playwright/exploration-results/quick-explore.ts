/**
 * Fast discovery script - directly explores demoqa.com structure
 * Uses quick page loads and focuses on testable surfaces
 */
import { firefox } from '@playwright/test';

async function quickExplore() {
  const browser = await firefox.launch({ headless: true });
  
  const sections = [
    { path: '/', name: 'Home' },
    { path: '/elements', name: 'Elements' },
    { path: '/forms', name: 'Forms' },
    { path: '/alertsWindows', name: 'Alerts & Windows' },
    { path: '/widgets', name: 'Widgets' },
    { path: '/interaction', name: 'Interactions' },
    { path: '/books', name: 'Book Store' }
  ];

  console.log('\n📊 DEMOQA.COM STRUCTURE\n');

  for (const section of sections) {
    const page = await browser.newPage();
    try {
      const url = `https://demoqa.com${section.path}`;
      await page.goto(url, { timeout: 5000, waitUntil: 'load' });
      
      // Get basic info
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean);
      });
      
      const forms = await page.evaluate(() => {
        return document.querySelectorAll('form').length;
      });
      
      const inputs = await page.evaluate(() => {
        return document.querySelectorAll('input').length;
      });

      console.log(`\n✓ ${section.name} (${section.path})`);
      if (forms > 0) console.log(`  Forms: ${forms}`);
      if (inputs > 0) console.log(`  Input fields: ${inputs}`);
      if (buttons.length > 0) console.log(`  Key actions: ${buttons.slice(0, 3).join(', ')}`);
    } catch (e) {
      console.log(`\n✗ ${section.name} (${section.path}) - Error loading`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\n✅ Quick exploration complete\n');
}

quickExplore().catch(console.error);
