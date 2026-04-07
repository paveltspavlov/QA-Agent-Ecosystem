import { test, expect } from '@playwright/test';
import { ElementsWebTablesPage } from '../../pages/elements-webtables.page';

test.describe('Table Operations - Web Tables', () => {
  test.fixme('6.1 Add New Entry to Web Table', async ({ page }) => {
    const webTablesPage = new ElementsWebTablesPage(page);
    await webTablesPage.goto('https://demoqa.com/webtables');

    const initialCount = await webTablesPage.getRowCount();

    await test.step('Open add form and fill fields', async () => {
      await webTablesPage.clickAddButton();
      await webTablesPage.fillTableFormField('firstName', 'Ciaran');
      await webTablesPage.fillTableFormField('lastName', 'Murphy');
      await webTablesPage.fillTableFormField('userEmail', 'ciaran@example.com');
      await webTablesPage.fillTableFormField('age', '28');
      await webTablesPage.fillTableFormField('salary', '50000');
      await webTablesPage.fillTableFormField('department', 'Engineering');
      await webTablesPage.submitTableForm();
    });

    await test.step('Verify new entry appears in table', async () => {
      const newRowCount = await webTablesPage.getRowCount();
      expect(newRowCount).toBeGreaterThan(initialCount);
      await expect(webTablesPage.getTableCell('Ciaran', 'Murphy')).toBeVisible();
    });
  });

  test.fixme('6.2 Edit Table Entry', async ({ page }) => {
    const webTablesPage = new ElementsWebTablesPage(page);
    await webTablesPage.goto('https://demoqa.com/webtables');

    await test.step('Edit first row salary', async () => {
      const firstRow = webTablesPage.getFirstTableRow();
      await webTablesPage.clickEditButtonForRow(firstRow);
      await webTablesPage.fillTableFormField('salary', '75000');
      await webTablesPage.submitTableForm();
    });

    await test.step('Verify salary change is reflected', async () => {
      const firstRow = webTablesPage.getFirstTableRow();
      const salary = webTablesPage.getTableCellValue('salary', firstRow);
      expect(salary).toContain('75000');
    });
  });

  test.fixme('6.3 Delete Table Entry', async ({ page }) => {
    const webTablesPage = new ElementsWebTablesPage(page);
    await webTablesPage.goto('https://demoqa.com/webtables');

    const initialCount = await webTablesPage.getRowCount();

    await test.step('Delete first row', async () => {
      const firstRow = webTablesPage.getFirstTableRow();
      await webTablesPage.clickDeleteButtonForRow(firstRow);
    });

    await test.step('Verify row was removed', async () => {
      const newRowCount = await webTablesPage.getRowCount();
      expect(newRowCount).toBeLessThan(initialCount);
    });
  });
});
