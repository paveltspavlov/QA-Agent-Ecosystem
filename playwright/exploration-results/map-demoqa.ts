/* @ts-nocheck */
/**
 * Detailed page mapping for demoqa.com
 * Identifies all testable surfaces and interactions
 * 
 * @ts-nocheck - Exploratory file with optional type safety
 */
import { chromium } from '@playwright/test';

interface MenuItem {
  name: string;
  selector: string;
  url: string;
}

async function mapDemoQA() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n🔍 COMPREHENSIVE DEMOQA.COM MAPPING\n');
  console.log('='.repeat(80));

  // Navigate to main page
  await page.goto('https://demoqa.com', { waitUntil: 'networkidle' });

  // Get all menu items and their links
  const menuItems = await page.evaluate(() => {
    const items = [];
    // Main navigation
    const navLinks = document.querySelectorAll('a[href*="/"]');
    navLinks.forEach((link: any) => {
      const href = link.getAttribute('href');
      const text = link.textContent?.trim();
      if (href && text && !href.includes('toolsqa.com')) {
        items.push({ text, href });
      }
    });
    return items;
  });

  console.log('\n📍 Main Navigation Items Found:');
  const uniquePages = new Map();
  for (const item of menuItems) {
    if (item.href && item.text) {
      uniquePages.set(item.href, item.text);
    }
  }

  for (const [href, text] of uniquePages) {
    console.log(`   ${text} → ${href}`);
  }

  // Explore Elements page
  console.log('\n\n📂 ELEMENTS SECTION (/elements)');
  console.log('='.repeat(80));
  await page.goto('https://demoqa.com/elements', { waitUntil: 'networkidle' });
  
  const elementSubPages = await page.evaluate(() => {
    const items = [];
    const sidebarLinks = document.querySelectorAll('a[href*="/elements"]');
    sidebarLinks.forEach((link: any) => {
      const href = link.getAttribute('href');
      const text = link.textContent?.trim();
      if (href && text) {
        items.push({ text, href });
      }
    });
    return items;
  });

  console.log('\nElement Subsections:');
  for (const item of elementSubPages.slice(0, 10)) {
    if (item.text && !item.text.includes('Elements') || item.text === 'Elements') {
      console.log(`   - ${item.text} (${item.href})`);
    }
  }

  // Explore Forms page
  console.log('\n\n📋 FORMS SECTION (/forms)');
  console.log('='.repeat(80));
  await page.goto('https://demoqa.com/forms', { waitUntil: 'networkidle' });
  
  const formsContent = await page.evaluate(() => {
    const formInputs = document.querySelectorAll('form input, form select, form textarea');
    return {
      formCount: document.querySelectorAll('form').length,
      fieldCount: formInputs.length,
      fieldTypes: Array.from(formInputs).map((f: any) => f.getAttribute('type') || f.tagName)
    };
  });

  console.log(`\nForms Found: ${formsContent.formCount}`);
  console.log(`Input Fields: ${formsContent.fieldCount}`);
  console.log(`Field Types: ${[...new Set(formsContent.fieldTypes)].join(', ')}`);

  // Explore Widgets page
  console.log('\n\n🎨 WIDGETS SECTION (/widgets)');
  console.log('='.repeat(80));
  await page.goto('https://demoqa.com/widgets', { waitUntil: 'networkidle' });
  
  const widgetSubPages = await page.evaluate(() => {
    const items = [];
    const sidebarLinks = document.querySelectorAll('a[href*="/widgets"]');
    sidebarLinks.forEach((link: any) => {
      const text = link.textContent?.trim();
      if (text && text.length > 2) {
        items.push(text);
      }
    });
    return items;
  });

  console.log('\nWidget Subsections:');
  for (const item of [...new Set(widgetSubPages)].slice(0, 15)) {
    console.log(`   - ${item}`);
  }

  // Explore Book Store
  console.log('\n\n📚 BOOK STORE APPLICATION (/books)');
  console.log('='.repeat(80));
  await page.goto('https://demoqa.com/books', { waitUntil: 'networkidle' });
  
  const bookStoreInfo = await page.evaluate(() => {
    return {
      tables: document.querySelectorAll('table').length,
      buttons: Array.from(document.querySelectorAll('button')).map((b: any) => b.textContent?.trim()),
      searchInputs: document.querySelectorAll('input[type="search"], input[placeholder*="search" i]').length
    };
  });

  console.log(`\nTables: ${bookStoreInfo.tables}`);
  console.log(`Search capability: ${bookStoreInfo.searchInputs > 0 ? 'Yes' : 'No'}`);
  console.log(`Main buttons: ${bookStoreInfo.buttons.filter(Boolean).slice(0, 5).join(', ')}`);

  await context.close();
  await browser.close();

  console.log('\n' + '='.repeat(80));
  console.log('✅ Mapping complete!\n');
}

mapDemoQA().catch(console.error);

