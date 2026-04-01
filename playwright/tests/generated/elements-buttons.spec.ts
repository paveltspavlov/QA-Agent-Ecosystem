import { test, expect } from '@playwright/test';
import { ElementsButtonsPage } from '../../pages/elements-buttons.page';

test.describe('Element Interactions - Buttons', () => {
  test('4.1 Click Button and Verify Response', async ({ page }) => {
    const buttonsPage = new ElementsButtonsPage(page);

    // Navigate to buttons page
    await buttonsPage.goto('https://demoqa.com/buttons');

    // Click the "Click Me" button
    await buttonsPage.clickClickMeButton();

    // Verify a response or message appears
    const singleClickMessage = buttonsPage.getSingleClickMessage();
    await expect(singleClickMessage).toBeVisible();

    // Click the "Double Click Me" button with a double-click
    await buttonsPage.doubleClickDoubleClickButton();

    // Verify the double-click response
    const doubleClickMessage = buttonsPage.getDoubleClickMessage();
    await expect(doubleClickMessage).toBeVisible();

    // Right-click on the "Right Click Me" button
    await buttonsPage.rightClickRightClickButton();

    // Verify the context menu response
    const rightClickMessage = buttonsPage.getRightClickMessage();
    await expect(rightClickMessage).toBeVisible();
  });
});
