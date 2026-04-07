import { test, expect } from '@playwright/test';
import { BooksPage } from '../../pages/books.page';

test.describe('Books & Search', () => {
  test.fixme('12.1 Search and Filter Books', async ({ page }) => {
    const booksPage = new BooksPage(page);
    await booksPage.goto('https://demoqa.com/books');

    let initialCount: number;

    await test.step('Verify book list is displayed', async () => {
      const bookList = booksPage.getBookList();
      await expect(bookList).toBeVisible();
      initialCount = await booksPage.getBookCount();
      expect(initialCount).toBeGreaterThan(0);
    });

    await test.step('Search for "Javascript" and verify filtering', async () => {
      await booksPage.searchBooks('Javascript');
      const filteredCount = await booksPage.getBookCount();
      expect(filteredCount).toBeLessThanOrEqual(initialCount!);
    });

    await test.step('Clear search and verify full list restored', async () => {
      await booksPage.clearSearch();
      const restoredCount = await booksPage.getBookCount();
      expect(restoredCount).toBe(initialCount!);
    });
  });
});
