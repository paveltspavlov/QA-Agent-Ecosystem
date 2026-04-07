import { test, Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ElementsWebTablesPage extends BasePage {
  readonly addButton: Locator = this.page.locator('button#addNewRecordButton');
  readonly tableRows: Locator = this.page.locator('div.rt-tr-group');
  readonly submitFormButton: Locator = this.page.locator('button#submit');

  constructor(page: Page) {
    super(page);
  }

  async clickAddButton(): Promise<void> {
    await this.addButton.click();
  }

  async fillTableFormField(fieldName: string, value: string): Promise<void> {
    await test.step(`Fill table field "${fieldName}" with "${value}"`, async () => {
      const input = this.page.locator(`input[placeholder*="${fieldName}"], input#${fieldName}`);
      await input.fill(value);
    });
  }

  async submitTableForm(): Promise<void> {
    await this.submitFormButton.click();
  }

  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  getFirstTableRow(): Locator {
    return this.tableRows.first();
  }

  /** Get visible table rows only (filters out empty placeholder rows). */
  getVisibleTableRows(): Locator {
    return this.tableRows.filter({ visible: true });
  }

  getTableCell(firstName: string, lastName: string): Locator {
    return this.page.locator(`text=${firstName}${lastName}`);
  }

  getTableCellValue(fieldName: string, row: Locator): Promise<string> {
    const cell = row.locator(`text=${fieldName}`);
    return cell.textContent() as Promise<string>;
  }

  async clickEditButtonForRow(row: Locator): Promise<void> {
    await test.step('Click edit button for row', async () => {
      const editButton = row.locator('[title="Edit"]').first();
      await editButton.click();
    });
  }

  async clickDeleteButtonForRow(row: Locator): Promise<void> {
    await test.step('Click delete button for row', async () => {
      const deleteButton = row.locator('[title="Delete"]').first();
      await deleteButton.click();
    });
  }
}
