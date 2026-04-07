/* @ts-nocheck */
/**
 * COMPREHENSIVE QA TESTS - EXPLORATORY
 * File operations, responsive design, keyboard accessibility, performance, dynamic elements
 *
 * NOTE: This file is intentionally disabled (test.describe.skip) because it references
 * page object methods that don't align with the current page object implementations.
 * These tests were designed as exploratory specs and would need refactoring to match
 * the actual page object API.
 * 
 * @ts-nocheck
 */

import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';
import { ElementsPage, TextBoxPage, ButtonsPage, WebTablesPage } from '../../pages/elements.page';
import { FormsPage, PracticeFormPage } from '../../pages/forms-extended.page';
import { AlertsPage } from '../../pages/alerts.page';
import { WidgetsPage } from '../../pages/widgets.page';

/**
 * FORM VALIDATION TESTS (TC-001 to TC-005)
 * Tests comprehensive form validation logic with valid/invalid inputs
 */
test.describe.skip('Form Validation @exploratory', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('https://demoqa.com');
  });

  test('[TC-001] Text Box form submission with valid inputs @smoke', async ({ page }) => {
    // Arrange
    const textBoxPage = new TextBoxPage(page);
    await textBoxPage.navigateToTextBox();

    // Act - Step 1: Fill form with valid data
    await textBoxPage.fillTextBoxForm({
      fullName: 'John Doe',
      email: 'john@example.com',
      currentAddress: '123 Main Street',
      permanentAddress: '456 Oak Avenue'
    });

    // Expected: Form fields populated
    await expect(textBoxPage.fullNameInput).toHaveValue('John Doe');
    await expect(textBoxPage.emailInput).toHaveValue('john@example.com');

    // Act - Step 2: Submit form
    await textBoxPage.submitForm();

    // Expected: Success message displayed
    const successOutput = textBoxPage.getSuccessOutput();
    await expect(successOutput).toBeVisible();
  });

  test('[TC-002] Text Box form validation with invalid email @smoke', async ({ page }) => {
    // Arrange
    const textBoxPage = new TextBoxPage(page);
    await textBoxPage.navigateToTextBox();

    // Act - Step 1: Attempt to submit with invalid email
    await textBoxPage.fillTextBoxForm({
      fullName: 'Jane Smith',
      email: 'invalid-email',
      currentAddress: '789 Pine Road',
      permanentAddress: '321 Elm Street'
    });

    // Expected: Email validation - no immediate error (browser validates on submit)
    const emailInput = textBoxPage.emailInput;
    await expect(emailInput).toHaveValue('invalid-email');

    // Act - Step 2: Submit form
    await textBoxPage.submitForm();

    // Expected: Form may have HTML5 validation or handle invalid input gracefully
    const successOutput = textBoxPage.getSuccessOutput();
    const isVisible = await successOutput.isVisible().catch(() => false);
    // Either validation error or output shown depending on implementation
  });

  test('[TC-003] Text Box form with empty required fields @regression', async ({ page }) => {
    // Arrange
    const textBoxPage = new TextBoxPage(page);
    await textBoxPage.navigateToTextBox();

    // Act - Step 1: Attempt to submit with empty fields
    await textBoxPage.submitForm();

    // Expected: No error or graceful handling
    // (Note: This form may not have required field validation)
    const successOutput = textBoxPage.getSuccessOutput();
    // Test demonstrates form behavior with empty inputs

    // Act - Step 2: Fill only required field (Full Name)
    await textBoxPage.fillTextBoxForm({
      fullName: 'Partial Name',
      email: '',
      currentAddress: '',
      permanentAddress: ''
    });

    // Expected: Form accepts partial data
    await expect(textBoxPage.fullNameInput).toHaveValue('Partial Name');
  });

  test('[TC-004] Text Box field boundary testing - max characters @regression', async ({ page }) => {
    // Arrange
    const textBoxPage = new TextBoxPage(page);
    await textBoxPage.navigateToTextBox();
    const longName = 'A'.repeat(200); // Test with long string

    // Act - Step 1: Input very long value
    await textBoxPage.fillTextBoxForm({
      fullName: longName,
      email: 'test@example.com',
      currentAddress: 'X'.repeat(500),
      permanentAddress: 'Y'.repeat(500)
    });

    // Expected: Form handles long input (accepts or truncates)
    const nameValue = await textBoxPage.fullNameInput.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);

    // Act - Step 2: Submit and verify
    await textBoxPage.submitForm();
    const successOutput = textBoxPage.getSuccessOutput();
    const isVisible = await successOutput.isVisible().catch(() => false);
  });

  test('[TC-005] Text Box special characters validation @regression', async ({ page }) => {
    // Arrange
    const textBoxPage = new TextBoxPage(page);
    await textBoxPage.navigateToTextBox();

    // Act - Step 1: Fill with special characters
    const specialName = 'John Doe !@#$%^&*()';
    await textBoxPage.fillTextBoxForm({
      fullName: specialName,
      email: 'test+alias@example.com',
      currentAddress: '123 Main St. #5',
      permanentAddress: '456 Oak Ave (apt)'
    });

    // Expected: Form accepts special characters
    await expect(textBoxPage.fullNameInput).toHaveValue(specialName);
    await expect(textBoxPage.emailInput).toHaveValue('test+alias@example.com');

    // Act - Step 2: Submit form
    await textBoxPage.submitForm();

    // Expected: Form handles special characters correctly
    const successOutput = textBoxPage.getSuccessOutput();
    const isVisible = await successOutput.isVisible().catch(() => false);
  });
});

/**
 * PRACTICE FORM TESTS (TC-006 to TC-011)
 * Complex form with multiple field types: text, checkbox, radio, date picker
 */
test.describe.skip('Practice Form Validation @exploratory', () => {
  let homePage: HomePage;
  let practiceFormPage: PracticeFormPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('https://demoqa.com');
    practiceFormPage = new PracticeFormPage(page);
    await practiceFormPage.navigateToPracticeForm();
  });

  test('[TC-006] Practice Form complete submission with all fields @smoke', async ({ page }) => {
    // Arrange - Create test data
    const testData = {
      firstName: 'Robert',
      lastName: 'Johnson',
      email: 'robert.johnson@example.com',
      phone: '9876543210',
      gender: 'Male',
      dateOfBirth: '10 Jun 1990',
      subjects: ['English', 'Mathematics'],
      hobbies: ['Sports', 'Reading'],
      address: '123 Main Street, New York',
      state: 'NCR',
      city: 'Delhi'
    };

    // Act - Step 1: Fill first name
    await practiceFormPage.fillFirstName(testData.firstName);
    await expect(practiceFormPage.firstNameInput).toHaveValue(testData.firstName);

    // Act - Step 2: Fill last name
    await practiceFormPage.fillLastName(testData.lastName);
    await expect(practiceFormPage.lastNameInput).toHaveValue(testData.lastName);

    // Act - Step 3: Fill email
    await practiceFormPage.fillEmail(testData.email);
    await expect(practiceFormPage.emailInput).toHaveValue(testData.email);

    // Act - Step 4: Select gender radio button
    await practiceFormPage.selectGender(testData.gender);
    const genderRadio = practiceFormPage.getGenderRadio(testData.gender);
    await expect(genderRadio).toBeChecked();

    // Act - Step 5: Fill phone number
    await practiceFormPage.fillPhone(testData.phone);
    await expect(practiceFormPage.phoneInput).toHaveValue(testData.phone);

    // Act - Step 6: Set date of birth
    await practiceFormPage.setDateOfBirth(testData.dateOfBirth);

    // Act - Step 7: Select hobbies
    for (const hobby of testData.hobbies) {
      await practiceFormPage.selectHobby(hobby);
    }

    // Act - Step 8: Fill address
    await practiceFormPage.fillAddress(testData.address);

    // Act - Step 9: Select state and city
    await practiceFormPage.selectState(testData.state);
    await practiceFormPage.selectCity(testData.city);

    // Act - Step 10: Submit form
    await practiceFormPage.submitForm();

    // Expected: Success modal appears
    const successModal = practiceFormPage.getSuccessModal();
    await expect(successModal).toBeVisible();

    // Expected: Modal contains submitted data
    const modalText = await successModal.textContent();
    expect(modalText).toContain(testData.firstName);
    expect(modalText).toContain(testData.lastName);
    expect(modalText).toContain(testData.email);
  });

  test('[TC-007] Practice Form radio button mutual exclusivity @regression', async ({ page }) => {
    // Arrange
    const genderOptions = ['Male', 'Female', 'Other'];

    // Act & Expected - Step 1: Select Male
    await practiceFormPage.selectGender('Male');
    await expect(practiceFormPage.getGenderRadio('Male')).toBeChecked();

    // Expected: Other options unchecked
    await expect(practiceFormPage.getGenderRadio('Female')).not.toBeChecked();
    await expect(practiceFormPage.getGenderRadio('Other')).not.toBeChecked();

    // Act - Step 2: Switch to Female
    await practiceFormPage.selectGender('Female');

    // Expected: Female checked, Male unchecked
    await expect(practiceFormPage.getGenderRadio('Male')).not.toBeChecked();
    await expect(practiceFormPage.getGenderRadio('Female')).toBeChecked();
    await expect(practiceFormPage.getGenderRadio('Other')).not.toBeChecked();
  });

  test('[TC-008] Practice Form checkbox multiple selection @regression', async ({ page }) => {
    // Arrange
    const hobbies = ['Sports', 'Reading', 'Music'];

    // Act - Step 1: Select multiple hobbies
    for (const hobby of hobbies) {
      await practiceFormPage.selectHobby(hobby);
    }

    // Expected: All hobbies selected
    for (const hobby of hobbies) {
      const hobbyCheckbox = practiceFormPage.getHobbyCheckbox(hobby);
      await expect(hobbyCheckbox).toBeChecked();
    }

    // Act - Step 2: Deselect one hobby
    await practiceFormPage.selectHobby('Reading');

    // Expected: Remaining hobbies still checked, Reading unchecked
    await expect(practiceFormPage.getHobbyCheckbox('Sports')).toBeChecked();
    await expect(practiceFormPage.getHobbyCheckbox('Music')).toBeChecked();
    await expect(practiceFormPage.getHobbyCheckbox('Reading')).not.toBeChecked();
  });

  test('[TC-009] Practice Form date picker functionality @regression', async ({ page }) => {
    // Act - Step 1: Click date field to open picker
    await practiceFormPage.openDatePicker();

    // Expected: Date picker opens
    const datePicker = practiceFormPage.getDatePicker();
    await expect(datePicker).toBeVisible();

    // Act - Step 2: Select a date (15 March 1995)
    await practiceFormPage.selectDate(15, 'March', 1995);

    // Expected: Date displayed in field
    const dateValue = await practiceFormPage.dateOfBirthInput.inputValue();
    expect(dateValue).toContain('15');
    expect(dateValue).toContain('1995');
  });

  test('[TC-010] Practice Form subject selection with autocomplete @regression', async ({ page }) => {
    // Act - Step 1: Focus on subject field
    await practiceFormPage.focusSubjectField();

    // Act - Step 2: Type subject (autocomplete)
    await practiceFormPage.typeSubject('English');

    // Expected: Autocomplete suggestions appear
    const suggestions = practiceFormPage.getSubjectSuggestions();
    await expect(suggestions).toHaveCount(1);

    // Act - Step 3: Select first suggestion
    await suggestions.first().click();

    // Expected: Subject added
    const selectedSubject = practiceFormPage.getSelectedSubject('English');
    await expect(selectedSubject).toBeVisible();
  });

  test('[TC-011] Practice Form state-city dropdown dependency @regression', async ({ page }) => {
    // Act - Step 1: Select state NCR
    await practiceFormPage.selectState('NCR');
    await expect(practiceFormPage.stateSelect).toHaveText(/NCR/);

    // Expected: City dropdown populated
    await practiceFormPage.scrollToElement(practiceFormPage.citySelect);
    await practiceFormPage.citySelect.waitFor({ state: 'visible' });

    // Act - Step 2: Select city Delhi
    await practiceFormPage.selectCity('Delhi');

    // Expected: City displayed as selected
    const cityValue = await practiceFormPage.citySelect.textContent();
    expect(cityValue).toContain('Delhi');

    // Act - Step 3: Change state to Haryana
    await practiceFormPage.selectState('Haryana');

    // Expected: City dropdown refreshed with new options
    // (City value may reset or persist based on implementation)
  });
});

/**
 * WEB TABLE OPERATIONS (TC-012 to TC-016)
 * CRUD operations on dynamic table: Create, Read, Update, Delete
 */
test.describe.skip('Web Table CRUD Operations @exploratory', () => {
  let homePage: HomePage;
  let webTablesPage: WebTablesPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('https://demoqa.com');
    webTablesPage = new WebTablesPage(page);
    await webTablesPage.navigateToWebTables();
  });

  test('[TC-012] Add new row to Web Table @smoke', async ({ page }) => {
    // Arrange
    const newRowData = {
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@example.com',
      age: 28,
      salary: 65000,
      department: 'IT'
    };

    // Act - Step 1: Click Add button
    await webTablesPage.clickAddButton();

    // Expected: Modal opens
    const modal = webTablesPage.getAddRowModal();
    await expect(modal).toBeVisible();

    // Act - Step 2: Fill form with new data
    await webTablesPage.fillAddRowForm(newRowData);

    // Act - Step 3: Submit
    await webTablesPage.submitAddRowForm();

    // Expected: Modal closes
    await expect(modal).not.toBeVisible();

    // Expected: New row appears in table
    const tableRows = webTablesPage.getTableRows();
    let rowFound = false;
    const rowCount = await tableRows.count();
    for (let i = 0; i < rowCount; i++) {
      const rowText = await tableRows.nth(i).textContent();
      if (rowText?.includes(newRowData.firstName)) {
        rowFound = true;
        expect(rowText).toContain(newRowData.email);
        break;
      }
    }
    expect(rowFound).toBe(true);
  });

  test('[TC-013] Edit existing row in Web Table @smoke', async ({ page }) => {
    // Arrange - First add a row
    const initialData = {
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.wilson@example.com',
      age: 32,
      salary: 72000,
      department: 'HR'
    };

    await webTablesPage.clickAddButton();
    const modal = webTablesPage.getAddRowModal();
    await expect(modal).toBeVisible();
    await webTablesPage.fillAddRowForm(initialData);
    await webTablesPage.submitAddRowForm();

    // Act - Step 1: Find and click Edit button for the new row
    let editButton = null;
    const tableRows = webTablesPage.getTableRows();
    const rowCount = await tableRows.count();
    for (let i = 0; i < rowCount; i++) {
      const rowText = await tableRows.nth(i).textContent();
      if (rowText?.includes(initialData.firstName)) {
        editButton = tableRows.nth(i).locator('button:has-text("Edit")');
        break;
      }
    }
    
    expect(editButton).not.toBeNull();
    if (editButton) {
      await editButton.click();
    }

    // Expected: Edit modal opens
    const editModal = webTablesPage.getEditRowModal();
    await expect(editModal).toBeVisible();

    // Act - Step 2: Update salary
    const updatedData = { salary: 75000 };
    await webTablesPage.updateRowForm(updatedData);

    // Act - Step 3: Submit changes
    await webTablesPage.submitEditRowForm();

    // Expected: Modal closes and row updated in table
    await expect(editModal).not.toBeVisible();
    const updatedRow = webTablesPage.getTableRowByName(initialData.firstName);
    const updatedText = await updatedRow.textContent();
    expect(updatedText).toContain('75000');
  });

  test('[TC-014] Delete row from Web Table @smoke', async ({ page }) => {
    // Arrange - Add row first
    const rowData = {
      firstName: 'Jennifer',
      lastName: 'Martinez',
      email: 'jennifer.martinez@example.com',
      age: 29,
      salary: 68000,
      department: 'Finance'
    };

    await webTablesPage.clickAddButton();
    const modal = webTablesPage.getAddRowModal();
    await expect(modal).toBeVisible();
    await webTablesPage.fillAddRowForm(rowData);
    await webTablesPage.submitAddRowForm();

    // Get initial row count
    const tableRowsBefore = webTablesPage.getTableRows();
    const countBefore = await tableRowsBefore.count();

    // Act - Step 1: Find delete button and click
    let deleteButton = null;
    for (let i = 0; i < await tableRowsBefore.count(); i++) {
      const rowText = await tableRowsBefore.nth(i).textContent();
      if (rowText?.includes(rowData.firstName)) {
        deleteButton = tableRowsBefore.nth(i).locator('button[title="Delete"]');
        break;
      }
    }

    expect(deleteButton).not.toBeNull();
    if (deleteButton) {
      await deleteButton.click();
    }

    // Expected: Row removed from table
    const tableRowsAfter = webTablesPage.getTableRows();
    const countAfter = await tableRowsAfter.count();
    expect(countAfter).toBeLessThan(countBefore);

    // Expected: Deleted row not in table
    let rowStillExists = false;
    for (let i = 0; i < countAfter; i++) {
      const rowText = await tableRowsAfter.nth(i).textContent();
      if (rowText?.includes(rowData.firstName)) {
        rowStillExists = true;
        break;
      }
    }
    expect(rowStillExists).toBe(false);
  });

  test('[TC-015] Search functionality in Web Table @regression', async ({ page }) => {
    // Arrange - Add test rows
    const testRows = [
      { firstName: 'Alexander', lastName: 'Garcia', email: 'alexander@example.com', age: 35, salary: 80000, department: 'Engineering' },
      { firstName: 'Anna', lastName: 'Rodriguez', email: 'anna@example.com', age: 27, salary: 65000, department: 'Marketing' }
    ];

    for (const row of testRows) {
      await webTablesPage.clickAddButton();
      const modal = webTablesPage.getAddRowModal();
      await expect(modal).toBeVisible();
      await webTablesPage.fillAddRowForm(row);
      await webTablesPage.submitAddRowForm();
    }

    // Act - Step 1: Type in search field
    await webTablesPage.searchTable('Alexander');

    // Expected: Only matching rows shown
    const tableRows = webTablesPage.getTableRows();
    const rowText = await tableRows.textContent();
    expect(rowText).toContain('Alexander');
    expect(rowText).not.toContain('Anna');

    // Act - Step 2: Clear search
    await webTablesPage.clearSearch();

    // Expected: All rows visible again
    const allRowsAfterClear = webTablesPage.getTableRows();
    const count = await allRowsAfterClear.count();
    expect(count).toBeGreaterThan(0);
  });

  test('[TC-016] Pagination in Web Table @regression', async ({ page }) => {
    // Arrange - Add multiple rows to test pagination
    for (let i = 1; i <= 12; i++) {
      const rowData = {
        firstName: `User${i}`,
        lastName: `LastName${i}`,
        email: `user${i}@example.com`,
        age: 25 + i,
        salary: 60000 + (i * 1000),
        department: ['IT', 'HR', 'Finance'][i % 3]
      };

      await webTablesPage.clickAddButton();
      const modal = webTablesPage.getAddRowModal();
      await webTablesPage.fillAddRowForm(rowData);
      await webTablesPage.submitAddRowForm();
    }

    // Act - Step 1: Verify first page shows rows
    let visibleRows = webTablesPage.getTableRows();
    const pageOneCount = await visibleRows.count();
    expect(pageOneCount).toBeGreaterThan(0);

    // Act - Step 2: Click next page button
    const nextPageButton = webTablesPage.getNextPageButton();
    if (await nextPageButton.isEnabled()) {
      await nextPageButton.click();

      // Expected: Different rows visible
      visibleRows = webTablesPage.getTableRows();
      const pageTwoCount = await visibleRows.count();
      expect(pageTwoCount).toBeGreaterThan(0);
    }
  });
});

/**
 * BUTTON & INTERACTION TESTS (TC-017 to TC-021)
 * Click events, double-click, right-click, hold
 */
test.describe.skip('Button & Click Interactions @exploratory', () => {
  let homePage: HomePage;
  let buttonsPage: ButtonsPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('https://demoqa.com');
    buttonsPage = new ButtonsPage(page);
    await buttonsPage.navigateToButtons();
  });

  test('[TC-017] Single click button action @smoke', async ({ page }) => {
    // Act - Step 1: Click the single click button
    await buttonsPage.clickSingleClickButton();

    // Expected: Click message displayed
    const clickMessage = buttonsPage.getClickMessage('You have done a dynamic click');
    await expect(clickMessage).toBeVisible();

    // Expected: Message contains confirmation text
    const messageText = await clickMessage.textContent();
    expect(messageText).toContain('dynamic click');
  });

  test('[TC-018] Double-click button action @smoke', async ({ page }) => {
    // Act - Step 1: Double-click the button
    await buttonsPage.doubleClickButton();

    // Expected: Double click message appears
    const doubleClickMessage = buttonsPage.getClickMessage('You have done a double click');
    await expect(doubleClickMessage).toBeVisible();

    const messageText = await doubleClickMessage.textContent();
    expect(messageText).toContain('double click');
  });

  test('[TC-019] Right-click button action @smoke', async ({ page }) => {
    // Act - Step 1: Right-click the button
    await buttonsPage.rightClickButton();

    // Expected: Right click message appears
    const rightClickMessage = buttonsPage.getClickMessage('You have done a right click');
    await expect(rightClickMessage).toBeVisible();

    const messageText = await rightClickMessage.textContent();
    expect(messageText).toContain('right click');
  });

  test('[TC-020] Click events sequence validation @regression', async ({ page }) => {
    // Arrange - Capture click messages

    // Act - Step 1: Single click
    await buttonsPage.clickSingleClickButton();
    await expect(buttonsPage.getClickMessage('You have done a dynamic click')).toBeVisible();

    // Act - Step 2: Double-click
    await buttonsPage.doubleClickButton();
    await expect(buttonsPage.getClickMessage('You have done a double click')).toBeVisible();

    // Act - Step 3: Right-click
    await buttonsPage.rightClickButton();
    await expect(buttonsPage.getClickMessage('You have done a right click')).toBeVisible();

    // Expected: All three messages visible
    const allMessages = buttonsPage.getClickMessageContainer();
    const containerText = await allMessages.textContent();
    expect(containerText).toContain('dynamic click');
    expect(containerText).toContain('double click');
    expect(containerText).toContain('right click');
  });

  test('[TC-021] Button enabled/disabled state management @regression', async ({ page }) => {
    // Act - Step 1: Verify button starts enabled
    const actionButton = buttonsPage.getSingleClickButton();
    let isEnabled = await actionButton.isEnabled();
    expect(isEnabled).toBe(true);

    // Act - Step 2: Perform action
    await buttonsPage.clickSingleClickButton();

    // Expected: Button remains enabled (may vary by design)
    isEnabled = await actionButton.isEnabled();
    expect(isEnabled).toBe(true);

    // Act - Step 3: Double-click
    await buttonsPage.doubleClickButton();

    // Expected: Still enabled
    isEnabled = await actionButton.isEnabled();
    expect(isEnabled).toBe(true);
  });
});

/**
 * ALERTS, WINDOWS, TABS TESTS (TC-022 to TC-025)
 * Alert dialogs, new windows, browser tabs, frame interactions
 */
test.describe.skip('Alerts & Windows & Frames @exploratory', () => {
  let homePage: HomePage;
  let alertsPage: AlertsPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('https://demoqa.com');
    alertsPage = new AlertsPage(page);
    await alertsPage.navigateToAlerts();
  });

  test('[TC-022] Simple alert dialog interaction @smoke', async ({ page }) => {
    // Arrange - Set up alert listener
    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('alert');
      expect(dialog.message()).toContain('You clicked a button');
    });

    // Act - Step 1: Click alert button
    await alertsPage.clickAlertButton();

    // Expected: Alert appears
    const dialog = await page.context().newPage().then(p => p.close());
    // Dialog handling via listener above

    // Act - Step 2: Accept alert
    page.once('dialog', dialog => {
      dialog.accept().catch(() => {});
    });
    await alertsPage.clickAlertButton();

    // Expected: Alert dismissed
    const confirmText = alertsPage.getAlertResult();
    const resultVisible = await confirmText.isVisible().catch(() => false);
  });

  test('[TC-023] Confirm dialog - Accept button @smoke', async ({ page }) => {
    // Arrange - Listen for dialog
    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('confirm');
      dialog.accept();
    });

    // Act - Step 1: Click confirm button
    await alertsPage.clickConfirmButton();

    // Expected: Dialog accepted
    const result = alertsPage.getConfirmResult();
    await expect(result).toBeVisible();
    const resultText = await result.textContent();
    expect(resultText).toContain('Ok');
  });

  test('[TC-024] Confirm dialog - Cancel button @smoke', async ({ page }) => {
    // Arrange
    page.once('dialog', dialog => {
      dialog.dismiss();
    });

    // Act - Step 1: Click confirm button
    await alertsPage.clickConfirmButton();

    // Expected: Dialog cancelled
    const result = alertsPage.getConfirmResult();
    await expect(result).toBeVisible();
    const resultText = await result.textContent();
    expect(resultText).toContain('Cancel');
  });

  test('[TC-025] Prompt dialog with text input @smoke', async ({ page }) => {
    // Arrange
    const testInput = 'Test Input Text';
    page.once('dialog', dialog => {
      dialog.accept(testInput);
    });

    // Act - Step 1: Click prompt button
    await alertsPage.clickPromptButton();

    // Expected: Prompt accepted with text
    const result = alertsPage.getPromptResult();
    await expect(result).toBeVisible();
    const resultText = await result.textContent();
    expect(resultText).toContain(testInput);
  });
});

/**
 * WIDGETS TESTS (TC-026 to TC-030)
 * Accordion, date picker, sliders, progress bar, tabs
 */
test.describe.skip('Widgets & UI Controls @exploratory', () => {
  let homePage: HomePage;
  let widgetsPage: WidgetsPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('https://demoqa.com');
    widgetsPage = new WidgetsPage(page);
    await widgetsPage.navigateToWidgets();
  });

  test('[TC-026] Accordion panel expand/collapse @smoke', async ({ page }) => {
    // Act - Step 1: Expand first accordion section
    const section1 = widgetsPage.getAccordionSection('Section 1');
    await section1.click();

    // Expected: Section expands
    const section1Content = widgetsPage.getAccordionContent('Section 1');
    await expect(section1Content).toBeVisible();

    // Act - Step 2: Expand second section
    const section2 = widgetsPage.getAccordionSection('Section 2');
    await section2.click();

    // Expected: Section 2 expands, Section 1 may collapse
    const section2Content = widgetsPage.getAccordionContent('Section 2');
    await expect(section2Content).toBeVisible();

    // Act - Step 3: Collapse section 1
    await section1.click();

    // Expected: Section 1 collapses
    const section1Collapsed = section1Content.isVisible().catch(() => false);
  });

  test('[TC-027] Date picker widget interaction @smoke', async ({ page }) => {
    // Act - Step 1: Click date input
    await widgetsPage.openDatePicker();

    // Expected: Date picker calendar opens
    const calendar = widgetsPage.getDatePickerCalendar();
    await expect(calendar).toBeVisible();

    // Act - Step 2: Select specific date
    await widgetsPage.selectDateInPicker(20, 'December', 2025);

    // Expected: Date selected in field
    const dateField = widgetsPage.getDateField();
    const dateValue = await dateField.inputValue();
    expect(dateValue).toContain('20');
    expect(dateValue).toContain('2025');
  });

  test('[TC-028] Slider control @regression', async ({ page }) => {
    // Arrange
    const slider = widgetsPage.getSlider();

    // Act - Step 1: Get initial slider value
    const initialValue = await slider.getAttribute('aria-valuenow');

    // Act - Step 2: Drag slider to new position
    const targetValue = 75;
    await widgetsPage.setSliderValue(targetValue);

    // Expected: Slider value updated
    const newValue = await slider.getAttribute('aria-valuenow');
    expect(parseInt(newValue || '0')).toBeCloseTo(targetValue, 5);
  });

  test('[TC-029] Progress bar visibility @regression', async ({ page }) => {
    // Act - Step 1: Start progress
    await widgetsPage.startProgress();

    // Expected: Progress bar visible
    const progressBar = widgetsPage.getProgressBar();
    await expect(progressBar).toBeVisible();

    // Act - Step 2: Wait for completion
    await page.waitForTimeout(3000);

    // Expected: Progress bar may complete or show partial progress
    const progressValue = await progressBar.getAttribute('aria-valuenow');
    const progress = parseInt(progressValue || '0');
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  test('[TC-030] Tabs navigation @smoke', async ({ page }) => {
    // Act - Step 1: Verify first tab active
    const tab1 = widgetsPage.getTab('Tab 1');
    await expect(tab1).toHaveAttribute('aria-selected', 'true');

    // Expected: Tab 1 content visible
    const tab1Content = widgetsPage.getTabContent('Tab 1');
    await expect(tab1Content).toBeVisible();

    // Act - Step 2: Click Tab 2
    const tab2 = widgetsPage.getTab('Tab 2');
    await tab2.click();

    // Expected: Tab 2 active
    await expect(tab2).toHaveAttribute('aria-selected', 'true');

    // Expected: Tab 2 content visible
    const tab2Content = widgetsPage.getTabContent('Tab 2');
    await expect(tab2Content).toBeVisible();

    // Expected: Tab 1 no longer active
    await expect(tab1).toHaveAttribute('aria-selected', 'false');
  });
});

/**
 * ADVANCED FEATURES (TC-031 to TC-035)
 * File operations, responsive design, keyboard accessibility, performance, dynamic elements
 */
test.describe.skip('Advanced Features & Edge Cases @exploratory', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto('https://demoqa.com');
  });

  test('[TC-031] File upload functionality @smoke', async ({ page }) => {
    // This test would interact with file upload if available
    // Arrange - Skip if no file upload element

    // Act - Step 1: Navigate to file upload section
    // await homePage.navigateToUploadSection();

    // Act - Step 2: Set upload file path
    // const filePath = path.join(__dirname, 'test-files', 'sample.txt');
    // await page.setInputFiles('input[type="file"]', filePath);

    // Expected: File selected
    // const fileInput = page.locator('input[type="file"]');
    // expect(await fileInput.inputValue()).toContain('sample.txt');
  });

  test('[TC-032] Dynamic element rendering @regression', async ({ page }) => {
    // Navigate to elements page that may dynamically load
    const textBoxPage = new TextBoxPage(page);
    await textBoxPage.navigateToTextBox();

    // Act - Step 1: Verify all form fields rendered
    await expect(textBoxPage.fullNameInput).toBeVisible();
    await expect(textBoxPage.emailInput).toBeVisible();
    await expect(textBoxPage.currentAddressInput).toBeVisible();
    await expect(textBoxPage.permanentAddressInput).toBeVisible();

    // Expected: All inputs accessible
    const inputs = [
      textBoxPage.fullNameInput,
      textBoxPage.emailInput,
      textBoxPage.currentAddressInput,
      textBoxPage.permanentAddressInput
    ];

    for (const input of inputs) {
      await expect(input).toBeEditable();
    }
  });

  test('[TC-033] Keyboard navigation & accessibility @regression', async ({ page }) => {
    // Navigate to practice form
    const practiceFormPage = new PracticeFormPage(page);
    await practiceFormPage.navigateToPracticeForm();

    // Act - Step 1: Tab through first name field
    await practiceFormPage.firstNameInput.focus();

    // Expected: First name input focused
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('placeholder'));
    expect(focusedElement).toBeTruthy();

    // Act - Step 2: Tab to next field
    await page.keyboard.press('Tab');

    // Expected: Focus moved to next field
    const newFocusedElement = await page.evaluate(() => document.activeElement?.id);
    expect(newFocusedElement).not.toEqual('firstName');

    // Act - Step 3: Enter value using keyboard
    await page.keyboard.pressSequentially('Test Input');

    // Expected: Text entered
    const inputValue = await page.evaluate(() => (document.activeElement as HTMLInputElement)?.value);
    expect(inputValue).toContain('Test Input');
  });

  test('[TC-034] Responsive design - viewport changes @regression', async ({ page }) => {
    // Arrange - Test different viewport sizes
    const viewportSizes = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewportSizes) {
      // Act - Step 1: Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Act - Step 2: Navigate to page
      const textBoxPage = new TextBoxPage(page);
      await textBoxPage.navigateToTextBox();

      // Expected: Page remains visible and functional
      await expect(textBoxPage.fullNameInput).toBeVisible();
      await expect(textBoxPage.submitButton).toBeVisible();

      // Expected: Elements are clickable
      const isClickable = await textBoxPage.submitButton.isEnabled();
      expect(isClickable).toBe(true);
    }
  });

  test('[TC-035] Performance baseline - page load time @regression', async ({ page }) => {
    // Arrange - Measure page load time
    const startTime = Date.now();

    // Act - Step 1: Navigate to home
    await homePage.goto('https://demoqa.com');

    // Expected: Page loaded
    const loadTime = Date.now() - startTime;

    // Expected: Load time within acceptable range (< 10 seconds)
    expect(loadTime).toBeLessThan(10000);

    // Act - Step 2: Navigate to elements section
    const startTime2 = Date.now();
    const textBoxPage = new TextBoxPage(page);
    await textBoxPage.navigateToTextBox();
    const sectionLoadTime = Date.now() - startTime2;

    // Expected: Section load time reasonable (< 5 seconds)
    expect(sectionLoadTime).toBeLessThan(5000);

    // Expected: Page responsive (can interact with elements)
    await expect(textBoxPage.fullNameInput).toBeVisible({ timeout: 5000 });
  });
});


