import { test, expect } from '@playwright/test';
import { ElementsButtonsPage } from '../../pages/elements-buttons.page';

test.describe('Element Interactions - Buttons', () => {
  test('4.1 Click Button and Verify Response', async ({ page }) => {
    const buttonsPage = new ElementsButtonsPage(page);
    await buttonsPage.goto('https://demoqa.com/buttons');

    await test.step('Verify button roles are correct', async () => {
      await expect(buttonsPage.clickMeButton).toHaveRole('button');
      await expect(buttonsPage.doubleClickButton).toHaveRole('button');
      await expect(buttonsPage.rightClickButton).toHaveRole('button');
    });

    await test.step('Single click produces message', async () => {
      await buttonsPage.clickClickMeButton();
      await expect(buttonsPage.getSingleClickMessage()).toBeVisible();
    });

    await test.step('Double click produces message', async () => {
      await buttonsPage.doubleClickDoubleClickButton();
      await expect(buttonsPage.getDoubleClickMessage()).toBeVisible();
    });

    await test.step('Right click produces message', async () => {
      await buttonsPage.rightClickRightClickButton();
      await expect(buttonsPage.getRightClickMessage()).toBeVisible();
    });
  });
});
