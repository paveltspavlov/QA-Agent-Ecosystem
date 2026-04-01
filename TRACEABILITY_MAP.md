# Playwright Automation - Test Case Traceability

## Overview
This document provides comprehensive traceability mapping between the 35 exploratory test cases (TC-001 to TC-035) and their automated implementations in Playwright TypeScript.

**Project:** DemoQA Automation  
**Target URL:** https://demoqa.com  
**Framework:** Playwright with TypeScript  
**POM Pattern:** Yes (8 Page Objects)  
**Total Test Cases:** 35  
**Status:** ✅ Ready for Execution

---

## Test Case Mapping Summary

### Group 1: Form Validation Tests (TC-001 to TC-005)
Form input validation with valid/invalid data, boundary testing, and special character handling.

| Test Case | Spec File | Test Title | Page Object | Test Type |
|-----------|-----------|-----------|-------------|-----------|
| TC-001 | comprehensive.spec.ts | [TC-001] Text Box form submission with valid inputs | TextBoxPage | @smoke |
| TC-002 | comprehensive.spec.ts | [TC-002] Text Box form validation with invalid email | TextBoxPage | @smoke |
| TC-003 | comprehensive.spec.ts | [TC-003] Text Box form with empty required fields | TextBoxPage | @regression |
| TC-004 | comprehensive.spec.ts | [TC-004] Text Box field boundary testing - max characters | TextBoxPage | @regression |
| TC-005 | comprehensive.spec.ts | [TC-005] Text Box special characters validation | TextBoxPage | @regression |

**Implementation Details:**
- **Location:** `playwright/tests/exploratory/comprehensive.spec.ts` (Lines: Form Validation @exploratory)
- **Setup:** Navigate to Elements → Text Box
- **Teardown:** Auto-cleanup via test isolation
- **Test Data:** Uses TestData factory for unique values
- **Assertions:** HTML5 form validation, success output visibility

---

### Group 2: Practice Form Tests (TC-006 to TC-011)
Complex form with multiple field types: radio buttons, checkboxes, date pickers, dropdowns.

| Test Case | Spec File | Test Title | Page Object | Test Type |
|-----------|-----------|-----------|-------------|-----------|
| TC-006 | comprehensive.spec.ts | [TC-006] Practice Form complete submission with all fields | PracticeFormPage | @smoke |
| TC-007 | comprehensive.spec.ts | [TC-007] Practice Form radio button mutual exclusivity | PracticeFormPage | @regression |
| TC-008 | comprehensive.spec.ts | [TC-008] Practice Form checkbox multiple selection | PracticeFormPage | @regression |
| TC-009 | comprehensive.spec.ts | [TC-009] Practice Form date picker functionality | PracticeFormPage | @regression |
| TC-010 | comprehensive.spec.ts | [TC-010] Practice Form subject selection with autocomplete | PracticeFormPage | @regression |
| TC-011 | comprehensive.spec.ts | [TC-011] Practice Form state-city dropdown dependency | PracticeFormPage | @regression |

**Implementation Details:**
- **Location:** `playwright/tests/exploratory/comprehensive.spec.ts` (Lines: Practice Form Validation @exploratory)
- **Setup:** Navigate to Forms → Practice Form
- **Teardown:** Modal closes, form resets via submission
- **Test Data:** Uses TestData.registrationForm()
- **Assertions:** Success modal visibility, modal content validation, field state changes

---

### Group 3: Web Table CRUD Operations (TC-012 to TC-016)
Dynamic table with Create, Read, Update, Delete operations plus search and pagination.

| Test Case | Spec File | Test Title | Page Object | Test Type |
|-----------|-----------|-----------|-------------|-----------|
| TC-012 | comprehensive.spec.ts | [TC-012] Add new row to Web Table | WebTablesPage | @smoke |
| TC-013 | comprehensive.spec.ts | [TC-013] Edit existing row in Web Table | WebTablesPage | @smoke |
| TC-014 | comprehensive.spec.ts | [TC-014] Delete row from Web Table | WebTablesPage | @smoke |
| TC-015 | comprehensive.spec.ts | [TC-015] Search functionality in Web Table | WebTablesPage | @regression |
| TC-016 | comprehensive.spec.ts | [TC-016] Pagination in Web Table | WebTablesPage | @regression |

**Implementation Details:**
- **Location:** `playwright/tests/exploratory/comprehensive.spec.ts` (Lines: Web Table CRUD Operations @exploratory)
- **Setup:** Navigate to Elements → Web Tables
- **Test Data:** Uses TestData.webTableRow()
- **Assertions:** Row visibility, data persistence, row count changes
- **Note:** Tests create/modify/delete rows within single test execution

---

### Group 4: Button & Click Interactions (TC-017 to TC-021)
Single-click, double-click, right-click interactions and event handling.

| Test Case | Spec File | Test Title | Page Object | Test Type |
|-----------|-----------|-----------|-------------|-----------|
| TC-017 | comprehensive.spec.ts | [TC-017] Single click button action | ButtonsPage | @smoke |
| TC-018 | comprehensive.spec.ts | [TC-018] Double-click button action | ButtonsPage | @smoke |
| TC-019 | comprehensive.spec.ts | [TC-019] Right-click button action | ButtonsPage | @smoke |
| TC-020 | comprehensive.spec.ts | [TC-020] Click events sequence validation | ButtonsPage | @regression |
| TC-021 | comprehensive.spec.ts | [TC-021] Button enabled/disabled state management | ButtonsPage | @regression |

**Implementation Details:**
- **Location:** `playwright/tests/exploratory/comprehensive.spec.ts` (Lines: Button & Click Interactions @exploratory)
- **Setup:** Navigate to Elements → Buttons
- **Playwright Interactions:** page.click(), page.dblClick(), page.click({ button: 'right' })
- **Assertions:** Message visibility, message text content

---

### Group 5: Alerts & Windows & Frames (TC-022 to TC-025)
Alert dialogs, confirm dialogs, prompt dialogs, and dialog handling.

| Test Case | Spec File | Test Title | Page Object | Test Type |
|-----------|-----------|-----------|-------------|-----------|
| TC-022 | comprehensive.spec.ts | [TC-022] Simple alert dialog interaction | AlertsPage | @smoke |
| TC-023 | comprehensive.spec.ts | [TC-023] Confirm dialog - Accept button | AlertsPage | @smoke |
| TC-024 | comprehensive.spec.ts | [TC-024] Confirm dialog - Cancel button | AlertsPage | @smoke |
| TC-025 | comprehensive.spec.ts | [TC-025] Prompt dialog with text input | AlertsPage | @smoke |

**Implementation Details:**
- **Location:** `playwright/tests/exploratory/comprehensive.spec.ts` (Lines: Alerts & Windows & Frames @exploratory)
- **Setup:** Navigate to Alerts, Frame & Windows → Alerts
- **Playwright Handling:** page.once('dialog', handler), dialog.accept(), dialog.dismiss()
- **Assertions:** Dialog type validation, result text verification

---

### Group 6: Widgets & UI Controls (TC-026 to TC-030)
Accordion, date picker, tabs, sliders, progress bars, and dynamic widgets.

| Test Case | Spec File | Test Title | Page Object | Test Type |
|-----------|-----------|-----------|-------------|-----------|
| TC-026 | comprehensive.spec.ts | [TC-026] Accordion panel expand/collapse | WidgetsPage | @smoke |
| TC-027 | comprehensive.spec.ts | [TC-027] Date picker widget interaction | WidgetsPage | @smoke |
| TC-028 | comprehensive.spec.ts | [TC-028] Slider control | WidgetsPage | @regression |
| TC-029 | comprehensive.spec.ts | [TC-029] Progress bar visibility | WidgetsPage | @regression |
| TC-030 | comprehensive.spec.ts | [TC-030] Tabs navigation | WidgetsPage | @smoke |

**Implementation Details:**
- **Location:** `playwright/tests/exploratory/comprehensive.spec.ts` (Lines: Widgets & UI Controls @exploratory)
- **Setup:** Navigate to Widgets
- **Playwright Interactions:** Drag/mouse events for sliders, click for accordion/tabs
- **Assertions:** Element visibility, attribute values, ARIA role compliance

---

### Group 7: Advanced Features & Edge Cases (TC-031 to TC-035)
File operations, dynamic elements, keyboard navigation, responsive design, performance.

| Test Case | Spec File | Test Title | Page Object | Test Type |
|-----------|-----------|-----------|-------------|-----------|
| TC-031 | comprehensive.spec.ts | [TC-031] File upload functionality | (Various) | @smoke |
| TC-032 | comprehensive.spec.ts | [TC-032] Dynamic element rendering | TextBoxPage | @regression |
| TC-033 | comprehensive.spec.ts | [TC-033] Keyboard navigation & accessibility | PracticeFormPage | @regression |
| TC-034 | comprehensive.spec.ts | [TC-034] Responsive design - viewport changes | TextBoxPage | @regression |
| TC-035 | comprehensive.spec.ts | [TC-035] Performance baseline - page load time | HomePage | @regression |

**Implementation Details:**
- **Location:** `playwright/tests/exploratory/comprehensive.spec.ts` (Lines: Advanced Features & Edge Cases @exploratory)
- **Setup:** Multiple setup scenarios (various pages)
- **Test Data:** Viewport sizes: [1920×1080, 768×1024, 375×667]
- **Assertions:** Load time < 10s, elements remain visible/clickable
- **Performance Thresholds:** Page load < 10s, section load < 5s

---

## File Organization

```
playwright/
├── pages/
│   ├── base.page.ts                    # Base class with common functionality
│   ├── home.page.ts                    # HomePage - main navigation
│   ├── elements.page.ts                # ElementsPage - sidebar navigation
│   ├── elements-extended.page.ts       # TextBoxPage, WebTablesPage, ButtonsPage
│   ├── forms.page.ts                   # FormsPage - form navigation
│   ├── forms-extended.page.ts          # PracticeFormPage, CheckBoxPage, etc.
│   ├── alerts.page.ts                  # AlertsPage - alert dialogs
│   ├── interactions.page.ts            # InteractionsPage
│   ├── widgets.page.ts                 # WidgetsPage - UI controls
│   └── login.page.ts                   # LoginPage - book store auth
│
├── tests/
│   └── exploratory/
│       └── comprehensive.spec.ts       # ALL 35 TEST CASES
│
├── test-data/
│   └── test.data.ts                    # TestData factory with unique value generation
│
├── fixtures/
│   └── (fixtures for shared setup/teardown)
│
└── components/
    └── (reusable component objects)
```

---

## Page Object Model Summary

### 8 Page Objects Created

1. **BasePage** (`base.page.ts`)
   - Abstract base class for all pages
   - Methods: goto(), waitForPageLoad(), takeScreenshot(), scrollToElement()
   - Timeout constants: SHORT (3s), MEDIUM (5s), LONG (10s), NAVIGATION (15s)

2. **HomePage** (`home.page.ts`)
   - Main landing page navigation
   - Methods: navigateToElements(), navigateToForms(), navigateToAlerts(), etc.

3. **TextBoxPage** (`elements-extended.page.ts`)
   - Form input fields: fullName, email, currentAddress, permanentAddress
   - Methods: fillTextBoxForm(), submitForm(), isOutputVisible()

4. **WebTablesPage** (`elements-extended.page.ts`)
   - CRUD operations on dynamic table
   - Methods: fillAddRowForm(), clickAddButton(), searchTable(), pagination()

5. **ButtonsPage** (`elements-extended.page.ts`)
   - Click event interactions
   - Methods: clickSingleClickButton(), doubleClickButton(), rightClickButton()

6. **AlertsPage** (`alerts.page.ts`)
   - Alert/confirm/prompt dialog handling
   - Methods: clickAlertButton(), clickConfirmButton(), clickPromptButton()

7. **PracticeFormPage** (`forms-extended.page.ts`)
   - Complex form with radio buttons, checkboxes, date pickers, dropdowns
   - Methods: fillFirstName(), selectGender(), selectHobby(), submitForm()

8. **WidgetsPage** (`widgets.page.ts`)
   - Accordion, tabs, date picker, slider, progress bar
   - Methods: getAccordionSection(), openDatePicker(), getTab(), setSliderValue()

---

## Test Execution Commands

### Run All Tests
```bash
npx playwright test playwright/tests/exploratory/comprehensive.spec.ts
```

### Run by Tag
```bash
# Smoke tests only (P1 tests)
npx playwright test --grep "@smoke"

# Regression tests
npx playwright test --grep "@regression"

# All exploratory tests
npx playwright test --grep "@exploratory"
```

### Run Specific Test Group
```bash
# Form validation tests (TC-001 to TC-005)
npx playwright test --grep "Form Validation"

# CRUD operations (TC-012 to TC-016)
npx playwright test --grep "Web Table CRUD"

# Button interactions (TC-017 to TC-021)
npx playwright test --grep "Button & Click"
```

### Run Single Test Case
```bash
npx playwright test --grep "TC-001"
npx playwright test --grep "TC-012"
npx playwright test --grep "TC-030"
```

### View Test Report
```bash
npx playwright show-report
```

---

## Test Priority Distribution

### 🔴 Smoke Tests (High Priority) - 12 cases
- TC-001: Text Box valid submission
- TC-002: Text Box invalid email
- TC-006: Practice Form complete submission
- TC-012: Web Table add row
- TC-013: Web Table edit row
- TC-014: Web Table delete row
- TC-017: Single click
- TC-018: Double-click
- TC-019: Right-click
- TC-022: Alert dialog
- TC-023: Confirm accept
- TC-030: Tabs navigation

### 🟡 Regression Tests (Medium Priority) - 23 cases
- TC-003 to TC-005: Form validation edge cases
- TC-007 to TC-011: Practice Form features
- TC-015 to TC-016: Table search & pagination
- TC-020 to TC-021: Click event sequences
- TC-024 to TC-029: Alerts & widgets
- TC-031 to TC-035: Advanced features

---

## Test Data Management

### Unique Data Generation
All test data is generated with timestamps and random suffixes to ensure test isolation:
```typescript
// Example: Test data factory generates unique values
user-1711784266507-a3b9c
prod-1711784266507-a3b9c
order-1711784266507-a3b9c
```

### Available Test Data Generators
```typescript
TestData.user()                    // Generates unique user with email
TestData.product()                 // Generates product with unique SKU
TestData.order()                   // Generates order with unique ID
TestData.address()                 // Generates address
TestData.registrationForm()        // Generates form data
TestData.textBoxForm()             // Generates text box form data
TestData.webTableRow()             // Generates table row data
```

---

## Selector Strategy

### Priority Order (as per Playwright best practices)
1. **`getByRole()`** - ARIA roles (BEST)
   ```typescript
   getByRole('button', { name: 'Submit' })
   getByRole('link', { name: 'Elements' })
   ```

2. **`getByTestId()`** - data-testid attributes
   ```typescript
   getByTestId('submit-button')
   ```

3. **`getByLabel()`** - Form labels
   ```typescript
   getByLabel('First Name')
   ```

4. **`getByPlaceholder()`** - Input placeholders
   ```typescript
   getByPlaceholder('name@example.com')
   ```

5. **CSS Selectors** - Last resort
   ```typescript
   locator('input[name="firstName"]')
   ```

---

## Waiting Strategy

### No Hardcoded Sleeps!
All tests use Playwright's built-in auto-waiting:

```typescript
// ✅ CORRECT - Playwright waits automatically
await button.click();
await expect(successMessage).toBeVisible();

// ❌ WRONG - Never use hardcoded sleeps
await page.waitForTimeout(1000);  // NEVER!
```

### Explicit Waits When Needed
```typescript
// Wait for specific conditions
await expect(modal).toBeVisible({ timeout: 5000 });
await element.waitFor({ state: 'enabled' });
```

---

## Continuous Integration Setup

### GitHub Actions Example
```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Known Issues & Workarounds

### Issue 1: React State Timing
**Problem:** React state updates may have slight delays
**Solution:** Use Playwright's waitFor() with appropriate timeouts (3-5s)

### Issue 2: Modal Disappearance
**Problem:** Some modals disappear quickly after interaction
**Solution:** Listen for dialogs and dismiss them immediately

### Issue 3: Dynamic Content
**Problem:** Content rendered dynamically may not be visible immediately
**Solution:** Use page.waitForLoadState('networkidle') after navigation

---

## Next Steps

1. **Setup Environment**
   ```bash
   npm install @playwright/test
   npx playwright install
   ```

2. **Run Tests**
   ```bash
   npx playwright test playwright/tests/exploratory/comprehensive.spec.ts
   ```

3. **View Results**
   ```bash
   npx playwright show-report
   ```

4. **Integrate into CI/CD**
   - Push to GitHub/GitLab
   - Configure GitHub Actions
   - Schedule nightly runs

---

## Support & References

- **Playwright Docs:** https://playwright.dev
- **DemoQA Website:** https://demoqa.com
- **ISTQB Standards:** https://istqb.org
- **Test Data Factory:** `playwright/test-data/test.data.ts`

---

**Generated:** March 29, 2026  
**Framework:** Playwright TypeScript  
**Total Tests:** 35  
**Status:** ✅ Production Ready  
**Last Updated:** 2026-03-29T16:17:46Z
