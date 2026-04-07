import { test, expect } from '@playwright/test';
import { WidgetsAutoCompletePage } from '../../pages/widgets-autocomplete.page';

test.describe('Widgets - Auto-Complete', () => {
  test.fixme('11.1 Test Autocomplete Input', async ({ page }) => {
    const autocompletePage = new WidgetsAutoCompletePage(page);
    await autocompletePage.goto('https://demoqa.com/auto-complete');

    await test.step('Single-value autocomplete: select "Red"', async () => {
      await autocompletePage.clickSingleAutocompleteField();
      await autocompletePage.fillSingleAutocompleteField('Red');
      await autocompletePage.selectSingleSuggestion('Red');
      await expect(autocompletePage.getSingleAutocompleteValue()).toContainText('Red');
    });

    await test.step('Multi-value autocomplete: select "Blue" and "Green"', async () => {
      await autocompletePage.clickMultiAutocompleteField();
      await autocompletePage.fillMultiAutocompleteField('Blue');
      await autocompletePage.selectMultiSuggestion('Blue');
      await autocompletePage.fillMultiAutocompleteField('Green');
      await autocompletePage.selectMultiSuggestion('Green');

      const multiValue = autocompletePage.getMultiAutocompleteValues();
      await expect(multiValue).toContainText('Blue');
      await expect(multiValue).toContainText('Green');
    });
  });
});
