import { test, expect } from '@playwright/test';
import { WidgetsAccordionPage } from '../../pages/widgets-accordion.page';

test.describe('Widgets - Accordions', () => {
  test('10.1 Expand and Collapse Accordion Sections', async ({ page }) => {
    const accordionPage = new WidgetsAccordionPage(page);

    // Navigate to accordion page
    await accordionPage.goto('https://demoqa.com/accordian');

    // Verify accordion sections are visible
    const firstHeader = accordionPage.getAccordionHeader(0);
    await expect(firstHeader).toBeVisible();

    // Click on first accordion header to expand
    await accordionPage.expandAccordion(0);

    // Verify content is displayed
    const firstContent = accordionPage.getAccordionContent(0);
    await expect(firstContent).toBeVisible();

    // Click on another accordion header
    await accordionPage.expandAccordion(1);

    // Verify first collapses and second expands (single-open behavior)
    await expect(accordionPage.getAccordionContent(0)).not.toBeVisible();
    await expect(accordionPage.getAccordionContent(1)).toBeVisible();

    // Click the expanded header to collapse
    await accordionPage.expandAccordion(1);

    // Verify content is hidden
    await expect(accordionPage.getAccordionContent(1)).not.toBeVisible();
  });
});
