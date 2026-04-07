import { test, expect } from '@playwright/test';
import { AlertsFramesPage } from '../../pages/alerts-frames.page';

test.describe('Frames', () => {
  test('15.1 Interact with iframe Content', async ({ page }) => {
    const framesPage = new AlertsFramesPage(page);
    await framesPage.goto('https://demoqa.com/frames');

    await test.step('Verify frame is loaded and contains content', async () => {
      const frame = framesPage.getMainFrame();
      const frameContent = frame.locator('body');
      await expect(frameContent).toBeVisible();

      const frameText = frame.getByRole('heading');
      await expect(frameText).not.toHaveCount(0);
      await expect(frameText.first()).toContainText(/.+/);
    });
  });
});
