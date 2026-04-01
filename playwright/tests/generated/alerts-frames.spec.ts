import { test, expect } from '@playwright/test';
import { AlertsFramesPage } from '../../pages/alerts-frames.page';

test.describe('Frames', () => {
  test('15.1 Interact with iframe Content', async ({ page }) => {
    const framesPage = new AlertsFramesPage(page);

    // Navigate to frames page
    await framesPage.goto('https://demoqa.com/frames');

    // Get the frame locator
    const frame = framesPage.getMainFrame();

    // Verify frame is loaded
    const frameContent = frame.locator('body');
    await expect(frameContent).toBeVisible();

    // Locate content within the frame
    const frameText = frame.getByRole('heading');

    // Verify frame content is accessible and readable
    await expect(frameText).not.toHaveCount(0);

    // Verify we can interact with frame content
    await expect(frameText.first()).toContainText(/.+/);
  });
});
