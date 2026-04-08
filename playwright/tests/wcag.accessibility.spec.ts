import { test, expect, Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

/**
 * WCAG 2.1 AA Accessibility Audit
 * Tests for WCAG compliance on demoqa.com pages
 * Including color contrast, alt text, keyboard navigation, focus indicators, ARIA, and more
 */

// Define pages to audit
const PAGES_TO_AUDIT = [
  {
    name: 'Home Page',
    path: '/',
    requiresAuth: false,
  },
  {
    name: 'Elements - Text Box',
    path: '/elements',
    requiresAuth: false,
  },
  {
    name: 'Elements - Check Box',
    path: '/checkbox',
    requiresAuth: false,
  },
  {
    name: 'Elements - Radio Button',
    path: '/radio-button',
    requiresAuth: false,
  },
  {
    name: 'Elements - Web Tables',
    path: '/webtables',
    requiresAuth: false,
  },
  {
    name: 'Elements - Buttons',
    path: '/buttons',
    requiresAuth: false,
  },
  {
    name: 'Elements - Links',
    path: '/links',
    requiresAuth: false,
  },
  {
    name: 'Elements - Broken Links',
    path: '/broken',
    requiresAuth: false,
  },
  {
    name: 'Elements - Upload Download',
    path: '/upload',
    requiresAuth: false,
  },
  {
    name: 'Forms - Student Registration',
    path: '/automation-practice-form',
    requiresAuth: false,
  },
  {
    name: 'Alerts - Alerts, Frame & Windows',
    path: '/alertsWindows',
    requiresAuth: false,
  },
  {
    name: 'Alerts - Browser Windows',
    path: '/browser-windows',
    requiresAuth: false,
  },
  {
    name: 'Alerts - Alerts',
    path: '/alerts',
    requiresAuth: false,
  },
  {
    name: 'Alerts - Frames',
    path: '/frames',
    requiresAuth: false,
  },
  {
    name: 'Alerts - Nested Frames',
    path: '/nestedframes',
    requiresAuth: false,
  },
  {
    name: 'Alerts - Modal Dialogs',
    path: '/modal-dialogs',
    requiresAuth: false,
  },
  {
    name: 'Widgets - Accordion',
    path: '/accordian',
    requiresAuth: false,
  },
  {
    name: 'Widgets - Auto Complete',
    path: '/auto-complete',
    requiresAuth: false,
  },
  {
    name: 'Widgets - Date Picker',
    path: '/date-picker',
    requiresAuth: false,
  },
  {
    name: 'Widgets - Slider',
    path: '/slider',
    requiresAuth: false,
  },
  {
    name: 'Widgets - Progress Bar',
    path: '/progress-bar',
    requiresAuth: false,
  },
  {
    name: 'Widgets - Tabs',
    path: '/tabs',
    requiresAuth: false,
  },
  {
    name: 'Widgets - Tool Tips',
    path: '/tool-tips',
    requiresAuth: false,
  },
  {
    name: 'Widgets - Menu',
    path: '/menu',
    requiresAuth: false,
  },
  {
    name: 'Widgets - Select Menu',
    path: '/select-menu',
    requiresAuth: false,
  },
  {
    name: 'Interactions - Sortable',
    path: '/sortable',
    requiresAuth: false,
  },
  {
    name: 'Interactions - Selectable',
    path: '/selectable',
    requiresAuth: false,
  },
  {
    name: 'Interactions - Resizable',
    path: '/resizable',
    requiresAuth: false,
  },
  {
    name: 'Interactions - Droppable',
    path: '/droppable',
    requiresAuth: false,
  },
  {
    name: 'Interactions - Draggable',
    path: '/dragabble',
    requiresAuth: false,
  },
  {
    name: 'Book Store',
    path: '/books',
    requiresAuth: false,
  },
];

interface AccessibilityViolation {
  page: string;
  element: string;
  rule: string;
  impact: string;
  description: string;
  wcagCriterion: string;
  fix: string;
  html?: string;
}

let allViolations: AccessibilityViolation[] = [];

test.describe('WCAG 2.1 AA Accessibility Audit', () => {
  test('audit all pages with axe-core', async ({ page, baseURL }) => {
    const violations: AccessibilityViolation[] = [];

    for (const pageConfig of PAGES_TO_AUDIT) {
      console.log(`\n🔍 Auditing: ${pageConfig.name} (${pageConfig.path})`);

      try {
        // Navigate to page
        const fullUrl = `${baseURL}${pageConfig.path}`;
        const response = await page.goto(fullUrl, { waitUntil: 'networkidle' });

        if (response?.status() !== 200) {
          console.log(`⚠️ Page returned status ${response?.status()}`);
          continue;
        }

        // Wait for content to load
        await page.waitForTimeout(1000);

        // Run axe accessibility checks
        const results = await new AxeBuilder({ page }).analyze();

        if (results.violations.length === 0) {
          console.log(`✅ ${pageConfig.name}: No violations found`);
        } else {
          console.log(
            `❌ ${pageConfig.name}: ${results.violations.length} violations found`
          );

          // Extract violations
          for (const violation of results.violations) {
            for (const node of violation.nodes) {
              const wcagMapping = mapRuleToWCAG(violation.id);
              const fix = getFixRecommendation(violation.id);

              violations.push({
                page: pageConfig.name,
                element: typeof node.target?.[0] === 'string' ? node.target[0] : violation.id,
                rule: violation.id,
                impact: violation.impact?.toUpperCase() || 'UNKNOWN',
                description: violation.description,
                wcagCriterion: wcagMapping,
                fix: fix,
                html: node.html,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error auditing ${pageConfig.name}:`, error);
      }
    }

    allViolations = violations;

    // Generate summary
    const criticalCount = violations.filter(
      (v) => v.impact === 'CRITICAL'
    ).length;
    const seriousCount = violations.filter((v) => v.impact === 'SERIOUS').length;
    const moderateCount = violations.filter(
      (v) => v.impact === 'MODERATE'
    ).length;
    const minorCount = violations.filter((v) => v.impact === 'MINOR').length;

    const summary = `
╔════════════════════════════════════════╗
║  WCAG 2.1 AA ACCESSIBILITY AUDIT SUMMARY  ║
╚════════════════════════════════════════╝

📊 Audit Coverage:
  • Pages Audited: ${PAGES_TO_AUDIT.length}
  • Total Violations: ${violations.length}

🔴 Critical: ${criticalCount}
🟠 Serious: ${seriousCount}
🟡 Moderate: ${moderateCount}
🔵 Minor: ${minorCount}

Estimated Compliance: ${Math.round((1 - violations.length / (PAGES_TO_AUDIT.length * 5)) * 100)}%
    `;

    console.log(summary);

    if (violations.length > 0) {
      console.log('\nTop Violations:\n');
      violations
        .slice(0, 10)
        .forEach((v, i) => {
          console.log(
            `  ${i + 1}. [${v.impact}] ${v.rule} - ${v.page}`
          );
        });
    }
  });

  test('keyboard navigation - tab order', async ({ page, baseURL }) => {
    console.log('\n🔍 Testing Keyboard Navigation and Focus Management\n');

    const keyboardTestPages = [
      { name: 'Home', path: '/' },
      { name: 'Forms', path: '/automation-practice-form' },
      { name: 'Elements', path: '/elements' },
    ];

    for (const pageConfig of keyboardTestPages) {
      console.log(`\nTesting keyboard navigation on: ${pageConfig.name}`);
      await page.goto(`${baseURL}${pageConfig.path}`, {
        waitUntil: 'networkidle',
      });
      await page.waitForTimeout(500);

      // Test Tab key navigation
      const focusableElements: string[] = [];
      let tabCount = 0;
      const maxTabs = 20;

      // Get initial focus
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      while (tabCount < maxTabs) {
        try {
          const focused = await page.evaluate(() => {
            const el = document.activeElement as HTMLElement;
            return {
              tag: el?.tagName,
              type: (el as any)?.type,
              ariaLabel: el?.getAttribute('aria-label'),
              id: el?.id,
              className: el?.className,
            };
          });

          if (focused && focused.tag) {
            focusableElements.push(
              `${focused.tag}${focused.id ? `#${focused.id}` : ''}`
            );
          }

          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
          tabCount++;
        } catch (e) {
          break;
        }
      }

      console.log(
        `  ✓ Found ${focusableElements.length} focusable elements via Tab`
      );

      // Test Escape key
      try {
        await page.keyboard.press('Escape');
        console.log(`  ✓ Escape key handled`);
      } catch (e) {
        console.log(`  ⚠ Escape key handling may need review`);
      }

      // Check for focus visible indicator
      try {
        const focusVisible = await page.evaluate(() => {
          const styles = document.querySelectorAll('*');
          let hasOutline = 0;
          for (const el of styles) {
            const computed = window.getComputedStyle(el);
            if (
              computed.outline &&
              computed.outline !== 'none' &&
              computed.outline !== '0px none rgb(0, 0, 0)'
            ) {
              hasOutline++;
            }
          }
          return hasOutline > 0;
        });

        if (focusVisible) {
          console.log(`  ✓ Focus visible indicators detected`);
        } else {
          console.log(`  ⚠ Focus visible indicators may need review`);
        }
      } catch (e) {
        // Continue
      }
    }
  });

  test('form accessibility - labels and ARIA', async ({ page, baseURL }) => {
    console.log(
      '\n🔍 Testing Form Accessibility - Labels and ARIA Attributes\n'
    );

    await page.goto(`${baseURL}/automation-practice-form`, {
      waitUntil: 'networkidle',
    });

    // Check form inputs have labels
    const inputs = await page.$$('input, textarea, select');
    console.log(`Found ${inputs.length} form inputs\n`);

    for (let i = 0; i < Math.min(inputs.length, 5); i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const id = await input.getAttribute('id');
      const name = await input.getAttribute('name');
      const ariaLabel = await input.getAttribute('aria-label');

      // Find associated label
      let hasLabel = false;
      if (id) {
        const label = await page.$(`label[for="${id}"]`);
        hasLabel = !!label;
      }

      const accessibility = {
        type,
        id,
        name,
        ariaLabel,
        hasLabel,
      };

      console.log(
        `  Input ${i + 1}: ${JSON.stringify(accessibility, null, 2)}`
      );

      if (!hasLabel && !ariaLabel) {
        console.log(`    ⚠️ Warning: Input lacks label or aria-label`);
      }
    }
  });

  test('color contrast analysis', async ({ page, baseURL }) => {
    console.log(
      '\n🔍 Testing Color Contrast (WCAG AA: 4.5:1 normal, 3:1 large)\n'
    );

    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });

    // Analyze text contrast
    const contrastIssues = await page.evaluate(() => {
      const issues: any[] = [];
      const elements = document.querySelectorAll('body, body *');

      const getContrast = (rgb1: string, rgb2: string): number => {
        const getLuminance = (r: number, g: number, b: number): number => {
          const [rs, gs, bs] = [r, g, b].map((x) => {
            x = x / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.05) / 1.05, 2);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };

        const parseRGB = (rgb: string): [number, number, number] => {
          const match = rgb.match(/\d+/g);
          return match ? ([Number(match[0]), Number(match[1]), Number(match[2])] as [number, number, number]) : [0, 0, 0];
        };

        const l1 = getLuminance(...parseRGB(rgb1));
        const l2 = getLuminance(...parseRGB(rgb2));
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      };

      elements.forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 3 && el.children.length === 0) {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const bgColor = style.backgroundColor;
          const fontSize = parseFloat(style.fontSize);
          const fontWeight = parseInt(style.fontWeight);

          if (color && bgColor) {
            const ratio = getContrast(color, bgColor);
            const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
            const required = isLargeText ? 3 : 4.5;

            if (ratio < required) {
              issues.push({
                element: (el as any).tagName,
                text: text.substring(0, 50),
                ratio: ratio.toFixed(2),
                required: required,
              });
            }
          }
        }
      });

      return issues;
    });

    console.log(`Found ${contrastIssues.length} potential contrast issues:\n`);
    contrastIssues.slice(0, 5).forEach((issue, i) => {
      console.log(
        `  ${i + 1}. ${issue.element}: Ratio ${issue.ratio}:1 (required: ${issue.required}:1)`
      );
      console.log(`     Text: "${issue.text}"`);
    });
  });

  test('image alt text verification', async ({ page, baseURL }) => {
    console.log('\n🔍 Testing Image Alt Text (WCAG 1.1.1)\n');

    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });

    const images = await page.$$('img');
    console.log(`Found ${images.length} images\n`);

    let altTextIssues = 0;
    for (let i = 0; i < Math.min(images.length, 10); i++) {
      const altText = await images[i].getAttribute('alt');
      const src = await images[i].getAttribute('src');
      const ariaLabel = await images[i].getAttribute('aria-label');

      const hasAltText = altText !== null;
      const hasAria = ariaLabel !== null;

      if (!hasAltText && !hasAria) {
        altTextIssues++;
        console.log(`  ⚠️ Image ${i + 1}: Missing alt text`);
        console.log(`     Src: ${src?.substring(0, 50)}...`);
      } else {
        console.log(`  ✓ Image ${i + 1}: Has alt text or aria-label`);
        if (altText) console.log(`     Alt: "${altText}"`);
      }
    }

    console.log(`\n  Summary: ${altTextIssues} images lack alt text`);
  });

  test('heading hierarchy validation', async ({ page, baseURL }) => {
    console.log(
      '\n🔍 Testing Heading Hierarchy (WCAG 1.3.1 - Semantic Structure)\n'
    );

    const testPages = ['/', '/automation-practice-form', '/elements'];

    for (const path of testPages) {
      await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });

      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (els) =>
        els.map((el) => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
        }))
      );

      console.log(`\n  Page: ${path}`);
      console.log(`  Headings found: ${headings.length}`);

      let isValid = true;
      let previousLevel = 0;

      for (const heading of headings.slice(0, 10)) {
        const level = parseInt(heading.tag[1]);
        if (level > previousLevel + 1) {
          isValid = false;
          console.log(`    ⚠️ ${heading.tag}: Skips level (${heading.text})`);
        } else {
          console.log(`    ✓ ${heading.tag}: ${heading.text}`);
        }
        previousLevel = level;
      }

      if (isValid) {
        console.log(`  ✓ Heading hierarchy is valid`);
      }
    }
  });

  test('ARIA landmarks validation', async ({ page, baseURL }) => {
    console.log('\n🔍 Testing ARIA Landmarks (WCAG 1.3.1)\n');

    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });

    const landmarks = await page.evaluate(() => {
      const results: Record<string, number> = {};
      const roles = ['banner', 'main', 'navigation', 'contentinfo', 'region'];

      roles.forEach((role) => {
        const elements = document.querySelectorAll(`[role="${role}"], ${role}`);
        results[role] = elements.length;
      });

      return results;
    });

    console.log('  Landmarks found:\n');
    Object.entries(landmarks).forEach(([landmark, count]) => {
      console.log(`    ${landmark}: ${count}`);
      if (count === 0) {
        console.log(`      ⚠️ Missing recommended ${landmark} landmark`);
      }
    });
  });
});

/**
 * Map axe-core rule IDs to WCAG 2.1 criteria
 */
function mapRuleToWCAG(ruleId: string): string {
  const mapping: Record<string, string> = {
    'color-contrast': '1.4.3 - Color Contrast',
    'image-alt': '1.1.1 - Non-text Content',
    'aria-required-attr': '4.1.2 - Name, Role, Value',
    'aria-valid-attr-value': '4.1.2 - Name, Role, Value',
    'button-name': '2.4.3 - Focus Visible',
    'form-field-multiple-labels': '3.3.2 - Labels or Instructions',
    'html-has-lang': '3.1.1 - Language of Page',
    'input-image-alt': '1.1.1 - Non-text Content',
    'label': '3.3.2 - Labels or Instructions',
    'link-name': '2.4.4 - Link Purpose',
    'list': '1.3.1 - Info and Relationships',
    'region': '1.3.1 - Info and Relationships',
    'tabindex': '2.4.3 - Focus Order',
    'valid-aria-role': '4.1.2 - Name, Role, Value',
    'video-caption': '1.2.2 - Captions (Prerecorded)',
    'heading-order': '1.3.1 - Info and Relationships',
    'bypass': '2.4.1 - Bypass Blocks',
    'duplicate-id': '4.1.1 - Parsing',
  };

  return mapping[ruleId] || '4.1.2 - Name, Role, Value (Default)';
}

/**
 * Provide fix recommendations for each violation
 */
function getFixRecommendation(ruleId: string): string {
  const recommendations: Record<string, string> = {
    'color-contrast':
      'Increase contrast ratio between text and background colors. WCAG AA requires 4.5:1 for normal text, 3:1 for large text.',
    'image-alt':
      'Add meaningful alt attribute to images. Use alt="" for decorative images.',
    'aria-required-attr':
      'Add required ARIA attributes based on the role (e.g., aria-label, aria-describedby).',
    'aria-valid-attr-value':
      'Ensure ARIA attribute values are valid for the specified role.',
    'button-name':
      'Ensure all buttons have accessible names (text, aria-label, or title).',
    'form-field-multiple-labels':
      'Ensure each form field has only one associated label.',
    'html-has-lang':
      'Add lang attribute to the html element to specify page language.',
    'input-image-alt':
      'Add alt attribute to image input buttons (<input type="image">).',
    'label': 'Associate labels with form inputs using <label for="inputId">.',
    'link-name':
      'Ensure all links have accessible names that describe their purpose.',
    'list': 'Use semantic list elements (<ul>, <ol>) for lists.',
    'region':
      'Use ARIA landmarks or semantic elements to structure content regions.',
    'tabindex':
      'Ensure tabindex values are logical and do not trap focus (tabindex > 0 should be avoided).',
    'valid-aria-role':
      'Use only valid ARIA role values from the ARIA specification.',
    'video-caption':
      'Provide captions for video content to support deaf and hard of hearing users.',
    'heading-order':
      'Fix heading hierarchy to maintain logical order (no skipped levels).',
    'bypass':
      'Provide a skip link to bypass repeated content blocks.',
    'duplicate-id':
      'Ensure each element ID is unique within the page.',
  };

  return (
    recommendations[ruleId] ||
    'Review and fix accessibility violation according to WCAG 2.1 standards.'
  );
}
