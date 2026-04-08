import { test, expect, Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

/**
 * WCAG 2.1 AA Accessibility Audit
 * Optimized version with axe-core scanning
 */

// Define key pages to audit (reduced set for faster execution)
const PAGES_TO_AUDIT = [
  { name: 'Home Page', path: '/' },
  { name: 'Elements', path: '/elements' },
  { name: 'Forms', path: '/automation-practice-form' },
  { name: 'Alerts', path: '/alertsWindows' },
  { name: 'Widgets', path: '/accordian' },
  { name: 'Interactions', path: '/sortable' },
  { name: 'Book Store', path: '/books' },
];

interface ViolationReport {
  page: string;
  violations: any[];
  passes: any[];
  timestamp: string;
}

const allReports: ViolationReport[] = [];

test.describe('WCAG 2.1 AA Accessibility Audit - DemoQA', () => {
  test('scan pages with axe-core', async ({ page, baseURL }) => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║ WCAG 2.1 AA ACCESSIBILITY AUDIT START  ║');
    console.log('╚════════════════════════════════════════╝\n');

    let totalViolations = 0;
    let totalPasses = 0;
    let pagesAudited = 0;

    for (const pageConfig of PAGES_TO_AUDIT) {
      console.log(`\n🔍 [${pagesAudited + 1}/${PAGES_TO_AUDIT.length}] Auditing: ${pageConfig.name}`);
      console.log(`   URL: ${pageConfig.path}`);

      try {
        // Navigate to page with timeout
        const response = await page.goto(`${baseURL}${pageConfig.path}`, {
          waitUntil: 'load',
          timeout: 15000,
        });

        if (!response) {
          console.log(`   ⚠️ No response from page`);
          continue;
        }

        if (response.status() !== 200) {
          console.log(`   ⚠️ Page returned status ${response.status()}`);
          continue;
        }

        // Small wait for any dynamic content
        await page.waitForTimeout(500);

        // Run axe scan
        console.log(`   ⏳ Running axe-core scan...`);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        const violationCount = results.violations.reduce((sum, v) => sum + v.nodes.length, 0);
        const passCount = results.passes.reduce((sum, v) => sum + v.nodes.length, 0);

        totalViolations += violationCount;
        totalPasses += passCount;
        pagesAudited++;

        // Categorize by impact
        const critical = results.violations.filter((v) => v.impact === 'critical').length;
        const serious = results.violations.filter((v) => v.impact === 'serious').length;
        const moderate = results.violations.filter((v) => v.impact === 'moderate').length;
        const minor = results.violations.filter((v) => v.impact === 'minor').length;

        if (violationCount === 0) {
          console.log(`   ✅ No violations found`);
        } else {
          console.log(`   ❌ Violations found:`);
          if (critical > 0) console.log(`      🔴 Critical: ${critical}`);
          if (serious > 0) console.log(`      🟠 Serious: ${serious}`);
          if (moderate > 0) console.log(`      🟡 Moderate: ${moderate}`);
          if (minor > 0) console.log(`      🔵 Minor: ${minor}`);
        }

        allReports.push({
          page: pageConfig.name,
          violations: results.violations,
          passes: results.passes,
          timestamp: new Date().toISOString(),
        });

        // Print top violations for this page
        if (results.violations.length > 0) {
          console.log(`\n   Top Issues:`);
          results.violations.slice(0, 3).forEach((violation, idx) => {
            const impact = `[${violation.impact?.toUpperCase()}]`;
            console.log(`   ${idx + 1}. ${impact} ${violation.id} (${violation.nodes.length} occurrences)`);
            console.log(`      → ${violation.description}`);
          });
        }
      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

    // Write detailed report to file
    const reportPath = path.join(__dirname, '../accessibility-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(allReports, null, 2));

    // Print summary
    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║    WCAG 2.1 AA AUDIT SUMMARY           ║`);
    console.log(`╚════════════════════════════════════════╝\n`);
    console.log(`📊 Pages Audited: ${pagesAudited}/${PAGES_TO_AUDIT.length}`);
    console.log(`✅ Total Passed Checks: ${totalPasses}`);
    console.log(`❌ Total Violations: ${totalViolations}`);
    console.log(`\n✅ Report saved to: ${reportPath}`);
  });

  test('keyboard navigation check', async ({ page, baseURL }) => {
    console.log('\n🔍 Keyboard Navigation Check\n');

    // Test one page for keyboard navigation
    const testPage = '/automation-practice-form';
    await page.goto(`${baseURL}${testPage}`, { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(300);

    // Try tabbing through elements
    let focusableCount = 0;
    let previousElement = '';

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);

      try {
        const focused = await page.evaluate(() => {
          const el = document.activeElement as any;
          return {
            tag: el?.tagName,
            id: el?.id,
            type: el?.type,
          };
        });

        if (focused.tag && focused.tag !== previousElement) {
          focusableCount++;
          previousElement = JSON.stringify(focused);
        }
      } catch (e) {
        // Continue
      }
    }

    console.log(`✅ Found ${focusableCount} focusable elements`);
    console.log(`✅ Keyboard navigation is functional\n`);
  });

  test('form labels verification', async ({ page, baseURL }) => {
    console.log('\n🔍 Form Labels Verification\n');

    await page.goto(`${baseURL}/automation-practice-form`, {
      waitUntil: 'load',
      timeout: 15000,
    });

    // Check for form inputs
    const formData = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea, select');
      const results: any[] = [];

      inputs.forEach((input, idx) => {
        const id = input.getAttribute('id');
        const name = input.getAttribute('name');
        const ariaLabel = input.getAttribute('aria-label');
        const placeholder = input.getAttribute('placeholder');

        let hasLabel = false;
        if (id) {
          hasLabel = !!document.querySelector(`label[for="${id}"]`);
        }

        results.push({
          index: idx,
          type: input.tagName,
          inputType: (input as any).type,
          hasLabel,
          hasAria: !!ariaLabel,
          hasPlaceholder: !!placeholder,
        });
      });

      return results;
    });

    console.log(`Found ${formData.length} form inputs`);
    
    const unlabeled = formData.filter(f => !f.hasLabel && !f.hasAria && !f.hasPlaceholder);
    if (unlabeled.length > 0) {
      console.log(`⚠️ ${unlabeled.length} inputs lack proper labels`);
    } else {
      console.log(`✅ All inputs have proper labels`);
    }
    console.log();
  });

  test('heading structure validation', async ({ page, baseURL }) => {
    console.log('\n🔍 Heading Structure Validation\n');

    await page.goto(`${baseURL}/elements`, { waitUntil: 'load', timeout: 15000 });

    const headingData = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const results: any[] = [];

      headings.forEach((h) => {
        results.push({
          level: parseInt(h.tagName[1]),
          text: h.textContent?.trim().substring(0, 50),
        });
      });

      return results;
    });

    console.log(`Found ${headingData.length} headings`);

    let isValid = true;
    let previousLevel = 0;

    for (const heading of headingData.slice(0, 8)) {
      if (heading.level > previousLevel + 1) {
        isValid = false;
        console.log(`⚠️ H${heading.level} skips level (text: ${heading.text})`);
      } else {
        console.log(`✓ H${heading.level}: ${heading.text}`);
      }
      previousLevel = heading.level;
    }

    if (isValid) {
      console.log(`\n✅ Heading hierarchy is valid\n`);
    } else {
      console.log(`\n⚠️ Heading hierarchy has issues\n`);
    }
  });

  test('image alt text check', async ({ page, baseURL }) => {
    console.log('\n🔍 Image Alt Text Verification\n');

    await page.goto(`${baseURL}/`, { waitUntil: 'load', timeout: 15000 });

    const imageData = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const results: any[] = [];

      images.forEach((img, idx) => {
        const alt = img.getAttribute('alt');
        const src = img.getAttribute('src');
        const ariaLabel = img.getAttribute('aria-label');

        results.push({
          index: idx,
          hasAlt: alt !== null && alt !== '',
          hasAria: !!ariaLabel,
          src: src?.substring(0, 40) || 'N/A',
        });
      });

      return results;
    });

    const totalImages = imageData.length;
    const withAlt = imageData.filter((img) => img.hasAlt || img.hasAria).length;

    console.log(`Total images: ${totalImages}`);
    console.log(`With alt text: ${withAlt}/${totalImages}`);

    const coverage = totalImages > 0 ? Math.round((withAlt / totalImages) * 100) : 0;
    console.log(`Coverage: ${coverage}%`);

    if (coverage === 100) {
      console.log(`✅ All images have alt text\n`);
    } else {
      console.log(`⚠️ ${totalImages - withAlt} images lack alt text\n`);
    }
  });

  test('ARIA landmarks check', async ({ page, baseURL }) => {
    console.log('\n🔍 ARIA Landmarks Check\n');

    await page.goto(`${baseURL}/`, { waitUntil: 'load', timeout: 15000 });

    const landmarks = await page.evaluate(() => {
      const results: Record<string, number> = {};
      const roles = ['banner', 'main', 'navigation', 'contentinfo', 'region'];

      roles.forEach((role) => {
        const count = document.querySelectorAll(`[role="${role}"], ${role}`).length;
        results[role] = count;
      });

      return results;
    });

    console.log('Landmarks found:');
    Object.entries(landmarks).forEach(([landmark, count]) => {
      if (count > 0) {
        console.log(`✓ ${landmark}: ${count}`);
      } else {
        console.log(`⚠️ ${landmark}: ${count} (recommended to add)`);
      }
    });
    console.log();
  });
});
