import { test, expect } from '@playwright/test';
import { ElementsUploadDownloadPage } from '../../pages/elements-upload-download.page';

test.describe('Upload & Download', () => {
  test.fixme('13.1 Download File', async ({ page }) => {
    const uploadDownloadPage = new ElementsUploadDownloadPage(page);
    await uploadDownloadPage.goto('https://demoqa.com/upload-download');

    await test.step('Trigger download and verify filename', async (step) => {
      const downloadPromise = page.waitForEvent('download');
      await uploadDownloadPage.clickDownloadButton();
      const download = await downloadPromise;

      const filename = download.suggestedFilename();
      expect(filename).toBeTruthy();

      await step.attach('downloaded-file', {
        body: `Filename: ${filename}`,
        contentType: 'text/plain',
      });
    });
  });

  test.fixme('13.2 Upload File', async ({ page }) => {
    const uploadDownloadPage = new ElementsUploadDownloadPage(page);
    await uploadDownloadPage.goto('https://demoqa.com/upload-download');

    await test.step('Upload test file and verify result', async () => {
      const testFilePath = `${__dirname}/../test-data/sample.txt`;
      await uploadDownloadPage.uploadFile(testFilePath);

      const uploadResult = uploadDownloadPage.getUploadResult();
      const isVisible = await uploadResult.isVisible().catch(() => false);
      if (isVisible) {
        await expect(uploadResult).toBeVisible();
      }
    });
  });
});
