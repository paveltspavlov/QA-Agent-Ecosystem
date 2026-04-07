import { test, expect } from '@playwright/test';
import { WidgetsAccordionPage } from '../../pages/widgets-accordion.page';

test.describe('Widgets - Accordions', () => {
  test('10.1 Expand and Collapse Accordion Sections', async ({ page }) => {
    const accordionPage = new WidgetsAccordionPage(page);
    await accordionPage.goto('https://demoqa.com/accordian');

    await test.step('Expand first accordion section', async () => {
      const firstHeader = accordionPage.getAccordionHeader(0);
      await expect(firstHeader).toBeVisible();
      await accordionPage.expandAccordion(0);
      await expect(accordionPage.getAccordionContent(0)).toBeVisible();
    });

    await test.step('Expand second section (single-open behavior)', async () => {
      await accordionPage.expandAccordion(1);
      await expect(accordionPage.getAccordionContent(0)).not.toBeVisible();
      await expect(accordionPage.getAccordionContent(1)).toBeVisible();
    });

    await test.step('Collapse second section', async () => {
      await accordionPage.expandAccordion(1);
      await expect(accordionPage.getAccordionContent(1)).not.toBeVisible();
    });
  });
});
