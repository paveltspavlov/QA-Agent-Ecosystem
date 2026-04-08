/* @ts-nocheck */
/**
 * Exploratory script for demoqa.com
 * 
 * @ts-nocheck - Exploratory file with optional type safety
 */
import { chromium, Browser, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface Element {
  selector: string;
  text?: string;
  type?: string;
  ariaLabel?: string;
  dataTestid?: string;
  placeholder?: string;
}

interface PageStructure {
  url: string;
  title: string;
  navigation?: string[];
  forms?: {
    id?: string;
    fields: Element[];
    submitButton?: Element;
  }[];
  elements?: Element[];
  tables?: {
    selector: string;
    columns?: string[];
  }[];
  modals?: {
    selector: string;
    title?: string;
  }[];
  links?: string[];
  description?: string;
}

interface ApplicationMap {
  baseUrl: string;
  explorationType: string;
  timestamp: string;
  pages: {
    [key: string]: PageStructure;
  };
  navigationMap: {
    [key: string]: string[];
  };
  allSelectors: {
    [key: string]: string[];
  };
}

async function extractElements(page: Page, selector: string): Promise<Element[]> {
  return await page.$$eval(selector, (elements: any[]) => {
    return elements.slice(0, 10).map(el => ({
      selector: el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase(),
      text: el.textContent?.trim().substring(0, 50),
      type: el.getAttribute('type'),
      ariaLabel: el.getAttribute('aria-label'),
      dataTestid: el.getAttribute('data-testid'),
      placeholder: el.getAttribute('placeholder'),
    }));
  }).catch(() => []);
}

async function explorePage(page: Page, url: string): Promise<PageStructure> {
  console.log(`\nExploring: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);
  } catch (e) {
    console.error(`Failed to navigate to ${url}`);
  }

  const title = await page.title();
  const structure: PageStructure = {
    url,
    title,
  };

  // Extract navigation
  const navLinks = await page.$$eval('nav a, [role="navigation"] a, .navbar a, .menu a, .sidebar a', (links: any[]) =>
    links.slice(0, 20).map(l => l.textContent?.trim() || l.href)
  ).catch(() => []);
  if (navLinks.length > 0) {
    structure.navigation = navLinks;
  }

  // Extract forms
  const forms = await page.$$('form');
  if (forms.length > 0) {
    structure.forms = [];
    for (let i = 0; i < Math.min(forms.length, 3); i++) {
      const form = forms[i];
      const fields = await form.$$eval('input, select, textarea, button[type="submit"]', (els: any[]) =>
        els.map(el => ({
          selector: el.getAttribute('data-testid') || el.name || el.id || el.placeholder || el.type,
          type: el.tagName.toLowerCase(),
          inputType: el.getAttribute('type'),
          ariaLabel: el.getAttribute('aria-label'),
          placeholder: el.getAttribute('placeholder'),
          dataTestid: el.getAttribute('data-testid'),
        }))
      ).catch(() => []);
      structure.forms.push({ fields });
    }
  }

  // Extract buttons
  const buttons = await extractElements(page, 'button, [role="button"], a.btn');
  if (buttons.length > 0) {
    structure.elements = buttons;
  }

  // Extract tables
  const tables = await page.$$('table');
  if (tables.length > 0) {
    structure.tables = [];
    for (let i = 0; i < Math.min(tables.length, 2); i++) {
      const table = tables[i];
      const headers = await table.$$eval('th', (ths: any[]) =>
        ths.map(th => th.textContent?.trim())
      ).catch(() => []);
      structure.tables.push({
        selector: `table:nth-of-type(${i + 1})`,
        columns: headers,
      });
    }
  }

  // Extract modals
  const modals = await page.$$('[role="dialog"], .modal, .dialog');
  if (modals.length > 0) {
    structure.modals = await Promise.all(modals.slice(0, 3).map(async (modal) => {
      const text = await modal.textContent().catch(() => '');
      return {
        selector: await modal.getAttribute('class').then(c => `.${c?.split(' ')[0]}`).catch(() => '.modal'),
        title: text.substring(0, 50),
      };
    }));
  }

  // Extract all links
  const links = await page.$$eval('a[href]', (as: any[]) =>
    [...new Set(as.map(a => a.href).filter((h: string) => h && !h.includes('javascript')))].slice(0, 30)
  ).catch(() => []);
  if (links.length > 0) {
    structure.links = links;
  }

  return structure;
}

async function discoverPages(browser: Browser): Promise<string[]> {
  const page = await browser.newPage();
  const discoveredUrls = new Set<string>();
  const visited = new Set<string>();
  const queue = ['https://demoqa.com'];

  while (queue.length > 0 && discoveredUrls.size < 50) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
      discoveredUrls.add(url);

      const links = await page.$$eval('a[href]', (as: any[]) =>
        as.map(a => a.href).filter((h: string) => h?.startsWith('https://demoqa.com'))
      ).catch(() => []);

      for (const link of links) {
        if (!visited.has(link) && queue.length < 30) {
          queue.push(link);
        }
      }
    } catch (e) {
      console.error(`Error visiting ${url}`);
    }
  }

  await page.close();
  return Array.from(discoveredUrls);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const appMap: ApplicationMap = {
    baseUrl: 'https://demoqa.com',
    explorationType: 'Full Website Structure Analysis',
    timestamp: new Date().toISOString(),
    pages: {},
    navigationMap: {},
    allSelectors: {},
  };

  try {
    console.log('🔍 Discovering pages...');
    const urls = await discoverPages(browser);
    console.log(`📄 Found ${urls.length} pages`);

    console.log('\n📋 Analyzing page structures...');
    for (const url of urls.slice(0, 25)) {
      const page = await browser.newPage();
      const structure = await explorePage(page, url);
      const key = new URL(url).pathname || '/';
      appMap.pages[key] = structure;
      await page.close();
    }

    // Extract all unique selectors
    Object.values(appMap.pages).forEach(pageStruct => {
      if (pageStruct.forms) {
        pageStruct.forms.forEach(form => {
          form.fields.forEach(field => {
            if (!appMap.allSelectors['formFields']) appMap.allSelectors['formFields'] = [];
            appMap.allSelectors['formFields'].push(field.selector);
          });
        });
      }
      if (pageStruct.elements) {
        if (!appMap.allSelectors['buttons']) appMap.allSelectors['buttons'] = [];
        pageStruct.elements.forEach(el => {
          appMap.allSelectors['buttons'].push(el.selector);
        });
      }
    });

    // Save results
    const outputDir = path.join(__dirname, 'exploration-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const mapFile = path.join(outputDir, 'demoqa-application-map.json');
    fs.writeFileSync(mapFile, JSON.stringify(appMap, null, 2));
    console.log(`\n✅ Saved application map to: ${mapFile}`);

    // Generate markdown report
    const markdownFile = path.join(outputDir, 'demoqa-structure-report.md');
    generateMarkdownReport(appMap, markdownFile);
    console.log(`✅ Saved markdown report to: ${markdownFile}`);

  } finally {
    await browser.close();
  }
}

function generateMarkdownReport(appMap: ApplicationMap, filepath: string) {
  let content = `# DemoQA Application Structure Report\n\n`;
  content += `**Generated:** ${appMap.timestamp}\n\n`;
  content += `## Overview\n\n`;
  content += `- **Base URL:** ${appMap.baseUrl}\n`;
  content += `- **Pages Discovered:** ${Object.keys(appMap.pages).length}\n\n`;

  content += `## Pages and Components\n\n`;

  Object.entries(appMap.pages).forEach(([path, page]) => {
    content += `### ${page.title || path}\n\n`;
    content += `- **URL:** \`${page.url}\`\n`;
    
    if (page.navigation && page.navigation.length > 0) {
      content += `- **Navigation:** ${page.navigation.join(', ')}\n`;
    }

    if (page.forms && page.forms.length > 0) {
      content += `- **Forms:**\n`;
      page.forms.forEach((form, i) => {
        content += `  - Form ${i + 1}:\n`;
        form.fields.forEach(field => {
          content += `    - \`${field.selector}\` (${field.type || field.inputType || 'unknown'})\n`;
        });
      });
    }

    if (page.tables && page.tables.length > 0) {
      content += `- **Tables:**\n`;
      page.tables.forEach((table, i) => {
        content += `  - Table ${i + 1}: ${table.columns?.join(', ') || 'unknown columns'}\n`;
      });
    }

    if (page.elements && page.elements.length > 0) {
      content += `- **Key Elements:** ${page.elements.slice(0, 5).map(e => e.selector).join(', ')}\n`;
    }

    content += `\n`;
  });

  fs.writeFileSync(filepath, content);
}

main().catch(console.error);

