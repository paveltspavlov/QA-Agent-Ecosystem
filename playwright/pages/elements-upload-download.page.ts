import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ElementsUploadDownloadPage extends BasePage {
  readonly downloadButton: Locator = this.page.locator('a#downloadButton');
  readonly uploadInput: Locator = this.page.locator('#uploadFile');
  readonly uploadResult: Locator = this.page.locator('#uploadedFilePath');

  constructor(page: Page) {
    super(page);
  }

  async clickDownloadButton(): Promise<void> {
    await this.downloadButton.click();
  }

  async uploadFile(filePath: string): Promise<void> {
    await this.uploadInput.setInputFiles(filePath);
  }

  getUploadResult(): Locator {
    return this.uploadResult;
  }
}
