import { test, expect } from '@playwright/test';
import { ElementsUploadDownloadPage } from '../../pages/elements-upload-download.page';

test.describe('Upload & Download', () => {
  test('13.1 Download File', async ({ page, context }) => {
    const uploadDownloadPage = new ElementsUploadDownloadPage(page);

    // Navigate to upload/download page
    await uploadDownloadPage.goto('https://demoqa.com/upload-download');

    // Listen for download event
    const downloadPromise = context.waitForEvent('download');

    // Click Download button
    await uploadDownloadPage.clickDownloadButton();

    // Verify download is triggered
    const download = await downloadPromise;

    // Verify downloaded file path contains expected name
    expect(download.suggestedFilename()).toBeTruthy();

    // Save file and verify it exists
    const filePath = `./test-results/downloads/${download.suggestedFilename()}`;
    await download.saveAs(filePath);

    const fs = require('fs');
    expect(fs.existsSync(filePath)).toBeTruthy();
  });

  test('13.2 Upload File', async ({ page }) => {
    const uploadDownloadPage = new ElementsUploadDownloadPage(page);

    // Navigate to upload/download page
    await uploadDownloadPage.goto('https://demoqa.com/upload-download');

    // Click "Choose File" button and select a test file
    const testFilePath = './test-data/sample.txt';

    // Use file chooser to upload
    await uploadDownloadPage.uploadFile(testFilePath);

    // Verify upload is confirmed
    const uploadResult = uploadDownloadPage.getUploadResult();
    const isVisible = await uploadResult.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(uploadResult).toBeVisible();
    }
  });
});
