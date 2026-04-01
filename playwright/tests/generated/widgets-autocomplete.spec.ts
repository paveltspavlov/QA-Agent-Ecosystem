import { test, expect } from '@playwright/test';
import { WidgetsAutoCompletePage } from '../../pages/widgets-autocomplete.page';

test.describe('Widgets - Auto-Complete', () => {
  test('11.1 Test Autocomplete Input', async ({ page }) => {
    const autocompletePage = new WidgetsAutoCompletePage(page);

    // Navigate to autocomplete page
    await autocompletePage.goto('https://demoqa.com/auto-complete');

    // Click on the single-value autocomplete field
    await autocompletePage.clickSingleAutocompleteField();

    // Type "Red" to trigger suggestions
    await autocompletePage.fillSingleAutocompleteField('Red');

    // Select a suggestion from the dropdown
    await autocompletePage.selectSingleSuggestion('Red');

    // Verify selected value is displayed
    await expect(autocompletePage.getSingleAutocompleteValue()).toContainText('Red');

    // Click on the multi-value autocomplete field
    await autocompletePage.clickMultiAutocompleteField();

    // Type "Blue" and select from suggestions
    await autocompletePage.fillMultiAutocompleteField('Blue');
    await autocompletePage.selectMultiSuggestion('Blue');

    // Type "Green" and select another option
    await autocompletePage.fillMultiAutocompleteField('Green');
    await autocompletePage.selectMultiSuggestion('Green');

    // Verify multiple values are displayed
    const multiValue = autocompletePage.getMultiAutocompleteValues();
    await expect(multiValue).toContainText('Blue');
    await expect(multiValue).toContainText('Green');
  });
});
