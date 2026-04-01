import { test, expect } from '@playwright/test';
import { ElementsCheckboxPage } from '../../pages/elements-checkbox.page';

test.describe('Element Interactions - Checkboxes', () => {
  test('2.1 Expand and Select Checkboxes', async ({ page }) => {
    const checkboxPage = new ElementsCheckboxPage(page);

    // Navigate to checkbox page
    await checkboxPage.goto('https://demoqa.com/checkbox');

    // Click the "Expand All" button if available
    await checkboxPage.expandAll();

    // Select multiple checkboxes (Documents and Desktop)
    await checkboxPage.selectCheckbox('Documents');
    await checkboxPage.selectCheckbox('Desktop');

    // Verify selected items are displayed
    const selectedItems = checkboxPage.getSelectedItemsList();
    await expect(selectedItems).toContainText('Documents');
    await expect(selectedItems).toContainText('Desktop');

    // Click a checkbox to deselect it
    await checkboxPage.deselectCheckbox('Desktop');

    // Verify deselection works
    await expect(checkboxPage.getSelectedItemsList()).not.toContainText('Desktop');
    await expect(checkboxPage.getSelectedItemsList()).toContainText('Documents');
  });
});
