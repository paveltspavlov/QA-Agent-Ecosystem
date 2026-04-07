import { test, expect } from '@playwright/test';
import { AlertsModalDialogsPage } from '../../pages/alerts-modal-dialogs.page';

test.describe('Modal Dialogs', () => {
  test.fixme('16.1 Open and Close Modal Dialog', async ({ page }) => {
    const modalPage = new AlertsModalDialogsPage(page);
    await modalPage.goto('https://demoqa.com/modal-dialogs');

    await test.step('Open small modal and verify visibility', async () => {
      await modalPage.clickSmallModalButton();
      const smallModal = modalPage.getSmallModal();
      await expect(smallModal).toBeVisible();
    });

    await test.step('Close small modal and verify dismissal', async () => {
      await modalPage.closeSmallModal();
      await expect(modalPage.getSmallModal()).not.toBeVisible();
    });
  });

  test.fixme('16.2 Large Modal Content', async ({ page }) => {
    const modalPage = new AlertsModalDialogsPage(page);
    await modalPage.goto('https://demoqa.com/modal-dialogs');

    await test.step('Open large modal and verify content', async () => {
      await modalPage.clickLargeModalButton();
      const largeModal = modalPage.getLargeModal();
      await expect(largeModal).toBeVisible();
      await largeModal.scrollIntoViewIfNeeded();
      await expect(largeModal).toContainText(/.+/);
    });

    await test.step('Close large modal', async () => {
      await modalPage.closeLargeModal();
      await expect(modalPage.getLargeModal()).not.toBeVisible();
    });
  });
});
