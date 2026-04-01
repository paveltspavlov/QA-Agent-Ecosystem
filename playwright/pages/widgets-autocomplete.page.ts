import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class WidgetsAutoCompletePage extends BasePage {
  readonly singleAutocompleteField: Locator = this.page.locator('#autoCompleteMultipleInput');
  readonly multiAutocompleteField: Locator = this.page.locator('#autoCompleteSingleInput');

  constructor(page: Page) {
    super(page);
  }

  async clickSingleAutocompleteField(): Promise<void> {
    await this.singleAutocompleteField.click();
  }

  async fillSingleAutocompleteField(value: string): Promise<void> {
    await this.singleAutocompleteField.fill(value);
  }

  async selectSingleSuggestion(suggestion: string): Promise<void> {
    const suggestionItem = this.page.locator(`.react-autosuggest__suggestion:has-text("${suggestion}")`);
    await suggestionItem.click();
  }

  getSingleAutocompleteValue(): Locator {
    return this.singleAutocompleteField;
  }

  async clickMultiAutocompleteField(): Promise<void> {
    await this.multiAutocompleteField.click();
  }

  async fillMultiAutocompleteField(value: string): Promise<void> {
    await this.multiAutocompleteField.fill(value);
  }

  async selectMultiSuggestion(suggestion: string): Promise<void> {
    const suggestionItem = this.page.locator(`.react-autosuggest__suggestion:has-text("${suggestion}")`);
    await suggestionItem.click();
  }

  getMultiAutocompleteValues(): Locator {
    return this.multiAutocompleteField;
  }
}
