import { Page, Locator } from '@playwright/test';
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
    const input = this.page.locator(`input[placeholder*="${fieldName}"], input#${fieldName}`);
    await input.fill(value);
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

  getTableCell(firstName: string, lastName: string): Locator {
    return this.page.locator(`text=${firstName}${lastName}`);
  }

  getTableCellValue(fieldName: string, row: Locator): Promise<string> {
    const cell = row.locator(`text=${fieldName}`);
    return cell.textContent() as Promise<string>;
  }

  async clickEditButtonForRow(row: Locator): Promise<void> {
    const editButton = row.locator('button[title="Edit"]');
    await editButton.click();
  }

  async clickDeleteButtonForRow(row: Locator): Promise<void> {
    const deleteButton = row.locator('button[title="Delete"]');
    await deleteButton.click();
  }
}
