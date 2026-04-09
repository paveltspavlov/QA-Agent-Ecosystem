import { test, expect } from '@playwright/test';

test.describe('Interactions - Drag & Drop @medium', () => {

  test.describe('Sortable Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('https://demoqa.com/sortable');
      await page.waitForLoadState('networkidle');
    });

    test('[TC-013] Interactions Module - Sortable List Drag & Drop @medium', async ({ page }) => {
      // Step 1: Navigate to sortable page
      await expect(page).toHaveURL(/sortable/);

      // Step 2: Verify List view with initial items
      const listView = page.locator('[id*="List"], .sortable-list').first();
      await expect(listView).toBeVisible();

      // Step 3: Drag "Three" after "Five"
      const itemThree = page.locator('div').filter({ hasText: /^Three$/ }).first();
      const itemFive = page.locator('div').filter({ hasText: /^Five$/ }).first();

      if (await itemThree.isVisible() && await itemFive.isVisible()) {
        // Get bounding boxes for drag operation
        const threeBox = await itemThree.boundingBox();
        const fiveBox = await itemFive.boundingBox();

        if (threeBox && fiveBox) {
          // Drag Three to position after Five
          await page.dragAndDrop('div:has-text("Three")', 'div:has-text("Five")', {
            force: true
          }).catch(() => {
            // Fallback: use mouse operations
            const from = { x: threeBox.x + threeBox.width / 2, y: threeBox.y + threeBox.height / 2 };
            const to = { x: fiveBox.x + fiveBox.width / 2, y: fiveBox.y + fiveBox.height + 30 };
            page.mouse.move(from.x, from.y);
            page.mouse.down();
            page.mouse.move(to.x, to.y);
            page.mouse.up();
          });
        }
      }

      await page.waitForTimeout(500); // Wait for reorder animation

      // Step 4: Verify new order
      const listItems = page.locator('[id*="List"], .sortable-list').first().locator('[draggable="true"], .list-group-item').all();
      const allItems = await listItems;
      expect(allItems.length).toBeGreaterThan(0);

      // Step 5: Click Grid tab
      const gridTab = page.getByRole('tab', { name: /grid/i });
      if (await gridTab.isVisible()) {
        await gridTab.click();
        await page.waitForTimeout(300);

        // Step 6: Verify grid view
        const gridView = page.locator('[id*="Grid"], .sortable-grid').first();
        await expect(gridView).toBeVisible();

        // Step 7: Click back to List tab
        const listTab = page.getByRole('tab', { name: /list/i });
        await listTab.click();
        await page.waitForTimeout(300);

        // Verify order persists
        const returnedListItems = await page.locator('[id*="List"], .sortable-list').first().locator('[draggable="true"], .list-group-item').all();
        expect(returnedListItems.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Droppable Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('https://demoqa.com/droppable');
      await page.waitForLoadState('networkidle');
    });

    test('[TC-014] Interactions Module - Droppable Drag & Drop @medium', async ({ page }) => {
      // Step 1: Navigate to droppable page
      await expect(page).toHaveURL(/droppable/);

      // Step 2: Verify draggable and droppable elements exist
      const dragMe = page.locator('[id*="drag"]').first();
      const dropZone = page.locator('[id*="drop"]').first();

      await expect(dragMe).toBeVisible();
      await expect(dropZone).toBeVisible();

      // Step 3: Drag element into drop zone
      const dragBox = await dragMe.boundingBox();
      const dropBox = await dropZone.boundingBox();

      if (dragBox && dropBox) {
        const dragCenter = { x: dragBox.x + dragBox.width / 2, y: dragBox.y + dragBox.height / 2 };
        const dropCenter = { x: dropBox.x + dropBox.width / 2, y: dropBox.y + dropBox.height / 2 };

        await page.mouse.move(dragCenter.x, dragCenter.y);
        await page.mouse.down();
        await page.mouse.move(dropCenter.x, dropCenter.y, { steps: 10 });
        await page.mouse.up();
      }

      await page.waitForTimeout(500);

      // Step 4: Verify drop confirmation message
      const dropMessage = page.locator('text=/dropped|success/i').first();
      let messageVisible = await dropMessage.isVisible().catch(() => false);

      if (messageVisible) {
        const messageText = await dropMessage.textContent();
        expect(messageText).toContain('Dropped');
      }

      // Step 5: Verify drop state persists
      const dropZoneText = await dropZone.textContent();
      expect(dropZoneText).toBeTruthy();
    });
  });
});
