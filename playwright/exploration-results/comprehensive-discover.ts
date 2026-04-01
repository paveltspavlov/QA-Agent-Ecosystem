import { chromium } from '@playwright/test';

/**
 * Comprehensive Discovery Script for demoqa.com
 * Explores all major sections and documents testable surfaces
 */

interface PageInfo {
  path: string;
  title: string;
  description: string;
  forms: string[];
  buttons: string[];
  inputs: string[];
  selectors: string[];
  tables: string[];
  other: string[];
}

const pages: PageInfo[] = [];

async function explorePage(browser: any, path: string, label: string): Promise<PageInfo> {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const pageInfo: PageInfo = {
    path,
    title: '',
    description: label,
    forms: [],
    buttons: [],
    inputs: [],
    selectors: [],
    tables: [],
    other: []
  };

  try {
    const url = `https://demoqa.com${path}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    pageInfo.title = await page.title();
    
    // Extract main content heading
    const h1 = await page.locator('h1').first().textContent();
    const h2 = await page.locator('h2').first().textContent();
    
    // Find all interactive elements
    const forms = await page.locator('form').all();
    pageInfo.forms = await Promise.all(forms.map((f: any) => f.getAttribute('id').catch(() => 'unnamed')));
    
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && text.trim()) {
        pageInfo.buttons.push(text.trim());
      }
    }
    
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const type = await input.getAttribute('type');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      pageInfo.inputs.push(`${type || 'text'}${id ? ` (#${id})` : ''}${placeholder ? ` [${placeholder}]` : ''}`);
    }
    
    // Look for select dropdowns
    const selects = await page.locator('select').all();
    for (const sel of selects) {
      const id = await sel.getAttribute('id');
      pageInfo.selectors.push(id || 'unnamed-select');
    }
    
    // Look for tables
    const tables = await page.locator('table').all();
    pageInfo.tables = tables.map((_: any) => 'table-found');
    
    // Look for other interactive elements
    const modals = await page.locator('[role="dialog"], .modal, .popup').all();
    if (modals.length > 0) pageInfo.other.push(`Modals: ${modals.length}`);
    
    const alerts = await page.locator('[role="alert"]').all();
    if (alerts.length > 0) pageInfo.other.push(`Alerts: ${alerts.length}`);
    
    const tabs = await page.locator('[role="tablist"], .tabs, .nav-tabs').all();
    if (tabs.length > 0) pageInfo.other.push(`Tab sections: ${tabs.length}`);

  } catch (error) {
    pageInfo.other.push(`Error: ${(error as any).message}`);
  } finally {
    await context.close();
  }

  return pageInfo;
}

async function runDiscovery() {
  const browser = await chromium.launch();

  const sections = [
    { path: '/', label: 'Home' },
    { path: '/elements', label: 'Elements' },
    { path: '/forms', label: 'Forms' },
    { path: '/alertsWindows', label: 'Alerts, Frame & Windows' },
    { path: '/widgets', label: 'Widgets' },
    { path: '/interaction', label: 'Interactions' },
    { path: '/books', label: 'Book Store Application' }
  ];

  console.log('\n🚀 DEMOQA.COM COMPREHENSIVE DISCOVERY\n');
  console.log('=' .repeat(70));

  for (const section of sections) {
    console.log(`\n📍 Exploring: ${section.label} (${section.path})`);
    const info = await explorePage(browser, section.path, section.label);
    pages.push(info);
    
    console.log(`   Title: ${info.title}`);
    if (info.forms.length > 0) console.log(`   Forms: ${info.forms.length}`);
    if (info.buttons.length > 0) console.log(`   Buttons: ${info.buttons.length}`);
    if (info.inputs.length > 0) console.log(`   Inputs: ${info.inputs.length}`);
    if (info.selectors.length > 0) console.log(`   Dropdowns: ${info.selectors.length}`);
    if (info.tables.length > 0) console.log(`   Tables: ${info.tables.length}`);
    if (info.other.length > 0) console.log(`   Other: ${info.other.join(', ')}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 DISCOVERY SUMMARY:');
  console.log(`Total pages discovered: ${pages.length}`);
  console.log(`Total forms found: ${pages.reduce((s, p) => s + p.forms.length, 0)}`);
  console.log(`Total buttons found: ${pages.reduce((s, p) => s + p.buttons.length, 0)}`);
  console.log(`Total input fields: ${pages.reduce((s, p) => s + p.inputs.length, 0)}`);
  
  // Print detailed findings
  console.log('\n📋 DETAILED FINDINGS:');
  pages.forEach(page => {
    if (page.buttons.length > 0) {
      console.log(`\n${page.description}:`);
      page.buttons.slice(0, 5).forEach(btn => console.log(`  - ${btn}`));
    }
  });

  await browser.close();
  console.log('\n✅ Discovery complete!\n');
}

runDiscovery().catch(console.error);
