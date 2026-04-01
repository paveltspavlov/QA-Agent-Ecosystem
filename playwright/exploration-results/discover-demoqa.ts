import { chromium } from '@playwright/test';

/**
 * Discovery script to systematically explore demoqa.com
 * Maps all pages, forms, and user journeys
 */

async function discoverDemoQA() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const discoveredPages = new Set<string>();
  const forms = new Map<string, any[]>();
  const elements = new Map<string, any[]>();

  try {
    // Navigate to home page
    console.log('\n🔍 Starting Discovery on demoqa.com...\n');
    await page.goto('https://demoqa.com', { waitUntil: 'domcontentloaded' });
    
    // Get all links on home page
    const links = await page.locator('a').all();
    console.log(`📍 Found ${links.length} links on home page`);
    
    const linkMap = new Map<string, string>();
    for (const link of links) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      if (href && text) {
        linkMap.set(text.trim(), href.trim());
      }
    }

    console.log('\n📋 Main Navigation Links:');
    for (const [text, href] of linkMap) {
      if (href && !href.startsWith('javascript')) {
        console.log(`  - [${text}] → ${href}`);
      }
    }

    // Try to identify main sections
    const menuItems = await page.locator('nav a, [role="navigation"] a, .menu a').all();
    console.log(`\n🗂️  Menu items found: ${menuItems.length}`);

    // Look for forms
    const forms_found = await page.locator('form').all();
    console.log(`\n📝 Forms found on home page: ${forms_found.length}`);

    // Look for buttons
    const buttons = await page.locator('button').all();
    console.log(`🔘 Buttons found: ${buttons.length}`);

    // Explore specific sections - check for common QA test scenarios
    const sections = [
      { name: 'Elements', selector: 'a:has-text("Elements")' },
      { name: 'Forms', selector: 'a:has-text("Forms")' },
      { name: 'Alerts, Frame & Windows', selector: 'a:has-text("Alerts")' },
      { name: 'Widgets', selector: 'a:has-text("Widgets")' },
      { name: 'Interactions', selector: 'a:has-text("Interactions")' },
      { name: 'Book Store', selector: 'a:has-text("Book Store")' },
    ];

    console.log('\n📂 Attempting to navigate to key sections:');
    for (const section of sections) {
      const sectionLink = page.locator(section.selector).first();
      if (await sectionLink.isVisible()) {
        console.log(`  ✓ ${section.name} - Available`);
      }
    }

    // Get page title and meta info
    const title = await page.title();
    const headings = await page.locator('h1, h2, h3').all();
    
    console.log(`\n📄 Page Title: ${title}`);
    console.log(`📑 Headings found: ${headings.length}`);

  } catch (error) {
    console.error('Discovery error:', error);
  } finally {
    await context.close();
    await browser.close();
  }

  console.log('\n✨ Discovery phase complete!\n');
}

discoverDemoQA().catch(console.error);
