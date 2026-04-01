import { test, expect } from '@playwright/test';
import { AlertsModalDialogsPage } from '../../pages/alerts-modal-dialogs.page';

test.describe('Modal Dialogs', () => {
  test('16.1 Open and Close Modal Dialog', async ({ page }) => {
    const modalPage = new AlertsModalDialogsPage(page);

    // Navigate to modal dialogs page
    await modalPage.goto('https://demoqa.com/modal-dialogs');

    // Click "Small Modal" button
    await modalPage.clickSmallModalButton();

    // Verify modal appears
    const smallModal = modalPage.getSmallModal();
    await expect(smallModal).toBeVisible();

    // Click Close button in modal
    await modalPage.closeSmallModal();

    // Verify modal is dismissed
    await expect(smallModal).not.toBeVisible();
  });

  test('16.2 Large Modal Content', async ({ page }) => {
    const modalPage = new AlertsModalDialogsPage(page);

    // Navigate to modal dialogs page
    await modalPage.goto('https://demoqa.com/modal-dialogs');

    // Click "Large Modal" button
    await modalPage.clickLargeModalButton();

    // Verify large modal content is visible
    const largeModal = modalPage.getLargeModal();
    await expect(largeModal).toBeVisible();

    // Scroll to see all content if necessary
    await largeModal.scrollIntoViewIfNeeded();

    // Verify modal contains text content
    await expect(largeModal).toContainText(/.+/);

    // Click Close
    await modalPage.closeLargeModal();

    // Verify modal closes
    await expect(largeModal).not.toBeVisible();
  });
});
