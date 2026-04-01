import { test, expect } from '@playwright/test';
import { BooksPage } from '../../pages/books.page';

test.describe('Books & Search', () => {
  test('12.1 Search and Filter Books', async ({ page }) => {
    const booksPage = new BooksPage(page);

    // Navigate to books page
    await booksPage.goto('https://demoqa.com/books');

    // Verify book list is displayed
    const bookList = booksPage.getBookList();
    await expect(bookList).toBeVisible();

    // Get initial book count
    const initialCount = await booksPage.getBookCount();
    expect(initialCount).toBeGreaterThan(0);

    // Use search functionality to find books by keyword
    await booksPage.searchBooks('Javascript');

    // Wait for search results
    await page.waitForLoadState('networkidle');

    // Verify filtered results are shown
    const filteredCount = await booksPage.getBookCount();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Clear search and verify full list returns
    await booksPage.clearSearch();

    // Wait for results to refresh
    await page.waitForLoadState('networkidle');

    // Verify full list is restored
    const restoredCount = await booksPage.getBookCount();
    expect(restoredCount).toBe(initialCount);
  });
});
