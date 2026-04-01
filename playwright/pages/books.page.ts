import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class BooksPage extends BasePage {
  readonly bookList: Locator = this.page.locator('.ReactTable');
  readonly searchInput: Locator = this.page.locator('#searchBox');

  constructor(page: Page) {
    super(page);
  }

  getBookList(): Locator {
    return this.bookList;
  }

  async getBookCount(): Promise<number> {
    return await this.page.locator('a[href*="book"]').count();
  }

  async searchBooks(keyword: string): Promise<void> {
    await this.searchInput.fill(keyword);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }
}
