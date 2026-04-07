import { test, expect } from '@playwright/test';
import { ElementsCheckboxPage } from '../../pages/elements-checkbox.page';

test.describe('Element Interactions - Checkboxes', () => {
  test.fixme('2.1 Expand and Select Checkboxes', async ({ page }) => {
    const checkboxPage = new ElementsCheckboxPage(page);
    await checkboxPage.goto('https://demoqa.com/checkbox');

    await test.step('Expand all checkbox nodes', async () => {
      await expect(checkboxPage.expandAllButton).toHaveRole('button');
      await checkboxPage.expandAll();
    });

    await test.step('Select Documents and Desktop checkboxes', async () => {
      await checkboxPage.selectCheckbox('Documents');
      await checkboxPage.selectCheckbox('Desktop');

      const selectedItems = checkboxPage.getSelectedItemsList();
      await expect(selectedItems).toContainText('Documents');
      await expect(selectedItems).toContainText('Desktop');
    });

    await test.step('Deselect Desktop and verify', async () => {
      await checkboxPage.deselectCheckbox('Desktop');
      await expect(checkboxPage.getSelectedItemsList()).not.toContainText('Desktop');
      await expect(checkboxPage.getSelectedItemsList()).toContainText('Documents');
    });
  });
});
