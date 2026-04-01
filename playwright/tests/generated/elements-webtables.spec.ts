import { test, expect } from '@playwright/test';
import { ElementsWebTablesPage } from '../../pages/elements-webtables.page';

test.describe('Table Operations - Web Tables', () => {
  test('6.1 Add New Entry to Web Table', async ({ page }) => {
    const webTablesPage = new ElementsWebTablesPage(page);

    // Navigate to web tables page
    await webTablesPage.goto('https://demoqa.com/webtables');

    // Get initial row count
    const initialCount = await webTablesPage.getRowCount();

    // Click the "Add" button
    await webTablesPage.clickAddButton();

    // Fill in form fields
    await webTablesPage.fillTableFormField('firstName', 'Ciaran');
    await webTablesPage.fillTableFormField('lastName', 'Murphy');
    await webTablesPage.fillTableFormField('userEmail', 'ciaran@example.com');
    await webTablesPage.fillTableFormField('age', '28');
    await webTablesPage.fillTableFormField('salary', '50000');
    await webTablesPage.fillTableFormField('department', 'Engineering');

    // Submit the form
    await webTablesPage.submitTableForm();

    // Verify the new entry appears in the table
    const newRowCount = await webTablesPage.getRowCount();
    expect(newRowCount).toBeGreaterThan(initialCount);

    // Verify new entry data is visible
    await expect(webTablesPage.getTableCell('Ciaran', 'Murphy')).toBeVisible();
  });

  test('6.2 Edit Table Entry', async ({ page }) => {
    const webTablesPage = new ElementsWebTablesPage(page);

    // Navigate to web tables page
    await webTablesPage.goto('https://demoqa.com/webtables');

    // Get first row for editing
    const firstRow = webTablesPage.getFirstTableRow();

    // Click the Edit button for the row
    await webTablesPage.clickEditButtonForRow(firstRow);

    // Modify a field (e.g., salary)
    await webTablesPage.fillTableFormField('salary', '75000');

    // Submit the form
    await webTablesPage.submitTableForm();

    // Verify changes are reflected in the table
    const salary = webTablesPage.getTableCellValue('salary', firstRow);
    expect(salary).toContain('75000');
  });

  test('6.3 Delete Table Entry', async ({ page }) => {
    const webTablesPage = new ElementsWebTablesPage(page);

    // Navigate to web tables page
    await webTablesPage.goto('https://demoqa.com/webtables');

    // Get initial row count
    const initialCount = await webTablesPage.getRowCount();

    // Get first row for deletion
    const firstRow = webTablesPage.getFirstTableRow();

    // Click the Delete button
    await webTablesPage.clickDeleteButtonForRow(firstRow);

    // Verify the row is removed from the table
    const newRowCount = await webTablesPage.getRowCount();
    expect(newRowCount).toBeLessThan(initialCount);
  });
});
