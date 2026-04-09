# Playwright Exploratory Test Suite - DemoQA

## 📋 Overview

This directory contains automated Playwright TypeScript tests generated from comprehensive exploratory testing of the [DemoQA](https://demoqa.com) web application.

**Test Coverage**: 25 automated test cases covering all major modules
- Navigation & Page Load (2 tests)
- Text Input & Validation (3 tests)
- Interactive Elements (2 tests)
- Complex Forms (2 tests)
- Alerts & Windows (2 tests)
- Widget Controls (3 tests)
- Drag & Drop Interactions (2 tests)
- Data Tables & File Operations (2 tests)
- Advanced Widgets (3 tests)
- Frames & Dynamic Content (4 tests)

---

## 📂 File Structure

```
playwright/tests/exploratory/
├── 01-navigation.spec.ts           # Navigation & error handling
├── 02-text-box.spec.ts             # Text input & validation
├── 03-checkbox-radio.spec.ts       # Checkbox & radio buttons
├── 04-practice-form.spec.ts        # Complex form submission
├── 05-alerts-windows.spec.ts       # Alert & window handling
├── 06-widgets-controls.spec.ts     # Slider, date picker, tabs
├── 07-interactions.spec.ts         # Drag & drop, sortable
├── 08-data-tables.spec.ts          # CRUD operations, file upload
├── 09-widgets-advanced.spec.ts     # Autocomplete, accordion, tooltips
├── 10-frames-dynamic.spec.ts       # Frames, dynamic content, responsiveness
├── TRACEABILITY_MATRIX.md          # Test case mapping documentation
└── README.md                        # This file
```

---

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have Node.js 16+ and npm installed:

```bash
node --version
npm --version
```

### 2. Install Dependencies

```bash
cd playwright
npm install
# or
npm ci  # For consistent dependency versions
```

### 3. Run All Tests

```bash
# Run all exploratory tests
npx playwright test tests/exploratory/

# Run with visible browser (UI mode)
npx playwright test tests/exploratory/ --ui

# Run headless (default, no browser visible)
npx playwright test tests/exploratory/ --headed
```

### 4. View Test Results

```bash
# After tests complete, open HTML report
npx playwright show-report

# Generate new report
npx playwright test tests/exploratory/ --reporter=html
```

---

## 📊 Test Files & Coverage

### 01-navigation.spec.ts (2 tests)
```typescript
test.describe('Navigation & Page Load @smoke')
  ✅ [TC-001] Homepage Loads Successfully
  ✅ [TC-022] Error Handling - Invalid URL Navigation
```
- **Duration**: ~10-15 seconds
- **Tags**: @smoke, @regression, @critical
- **Tests**: Homepage loading, 404 error handling

---

### 02-text-box.spec.ts (3 tests)
```typescript
test.describe('Elements - Text Box @smoke')
  ✅ [TC-002] Elements Module - Text Box Submission
  ✅ [TC-003] Elements Module - Text Box Invalid Email Validation
  ✅ [TC-025] Special Characters & XSS Test - Text Box Input
```
- **Duration**: ~15-20 seconds
- **Tags**: @smoke, @regression, @critical, @security
- **Tests**: Form submission, input validation, security (XSS protection)

---

### 03-checkbox-radio.spec.ts (2 tests)
```typescript
test.describe('Elements - Checkbox & Radio Buttons @smoke')
  ✅ [TC-004] Elements Module - CheckBox Nested Selection
  ✅ [TC-005] Elements Module - Radio Button Single Selection
```
- **Duration**: ~10-15 seconds
- **Tags**: @smoke, @high
- **Tests**: Tree checkbox selection, radio button mutual exclusivity

---

### 04-practice-form.spec.ts (2 tests)
```typescript
test.describe('Forms - Practice Form @smoke')
  ✅ [TC-006] Forms Module - Practice Form Submission with Valid Data
  ✅ [TC-007] Forms Module - Practice Form Required Field Validation
```
- **Duration**: ~20-25 seconds
- **Tags**: @smoke, @critical, @high
- **Tests**: Multi-field form submission, required field validation

---

### 05-alerts-windows.spec.ts (2 tests)
```typescript
test.describe('Alerts, Frames & Windows @smoke')
  ✅ [TC-008] Alerts, Frames & Windows - JavaScript Alerts
  ✅ [TC-009] Alerts, Frames & Windows - Browser Windows
```
- **Duration**: ~15-20 seconds
- **Tags**: @high
- **Tests**: Alert dialog handling, window/tab management

---

### 06-widgets-controls.spec.ts (3 tests)
```typescript
test.describe('Widgets - Interactive Controls @smoke')
  ✅ [TC-010] Widgets Module - Slider Interaction
  ✅ [TC-011] Widgets Module - Date Picker Selection
  ✅ [TC-012] Widgets Module - Tabs Navigation
```
- **Duration**: ~20-25 seconds
- **Tags**: @high, @medium
- **Tests**: Range slider drag, date picker calendar, tab switching

---

### 07-interactions.spec.ts (2 tests)
```typescript
test.describe('Interactions - Drag & Drop @medium')
  ✅ [TC-013] Interactions Module - Sortable List Drag & Drop
  ✅ [TC-014] Interactions Module - Droppable Drag & Drop
```
- **Duration**: ~15-20 seconds
- **Tags**: @medium
- **Tests**: Drag and drop operations, list sorting

---

### 08-data-tables.spec.ts (2 tests)
```typescript
test.describe('Elements - Data Tables & File Operations @medium')
  ✅ [TC-015] Elements Module - Web Tables CRUD Operations
  ✅ [TC-016] Elements Module - File Upload
```
- **Duration**: ~20-25 seconds
- **Tags**: @high, @medium
- **Tests**: Table CRUD (Create, Read, Update, Delete), file upload/download

---

### 09-widgets-advanced.spec.ts (3 tests)
```typescript
test.describe('Widgets - Advanced Controls @medium')
  ✅ [TC-017] Widgets Module - Autocomplete Input
  ✅ [TC-018] Widgets Module - Accordian Collapse/Expand
  ✅ [TC-024] Widgets - Tooltip Display on Hover
```
- **Duration**: ~20-25 seconds
- **Tags**: @medium
- **Tests**: Autocomplete filtering, accordion expand/collapse, tooltip hover

---

### 10-frames-dynamic.spec.ts (4 tests)
```typescript
test.describe('Advanced Features - Frames & Dynamic Content @high')
  ✅ [TC-019] Frames Module - Iframe Content Interaction
  ✅ [TC-020] Dynamic Wait Module - Dynamic Properties
  ✅ [TC-021] Mobile Responsiveness - Homepage on Mobile Viewport
  ✅ [TC-023] Forms - Phone Number Boundary Testing
```
- **Duration**: ~25-30 seconds
- **Tags**: @high, @medium
- **Tests**: Iframe context switching, dynamic element enabling, mobile viewport, input boundaries

---

## 🎯 Running Specific Test Groups

### Run Only P0 (Critical) Priority Tests
```bash
npx playwright test tests/exploratory/ --grep "@critical"
```

### Run Only Smoke Tests
```bash
npx playwright test tests/exploratory/ --grep "@smoke"
```

### Run Only High Priority P1 Tests
```bash
npx playwright test tests/exploratory/ --grep "@high"
```

### Run Specific Feature Tests
```bash
# Navigation tests only
npx playwright test tests/exploratory/01-navigation.spec.ts

# Text box tests only
npx playwright test tests/exploratory/02-text-box.spec.ts

# All widget tests
npx playwright test tests/exploratory/0[6-9]-*.spec.ts
```

---

## 🔍 Test Execution Modes

### Default Headless Mode
```bash
npx playwright test tests/exploratory/
```
- Fastest execution (no browser UI rendering)
- Best for CI/CD pipelines
- Typical duration: ~2-3 minutes for full suite

### UI Mode (Interactive Debugging)
```bash
npx playwright test tests/exploratory/ --ui
```
- Opens browser for each test step
- Step through test execution
- Inspect elements and debug
- Perfect for troubleshooting failures

### Debug Mode (Browser Visible)
```bash
npx playwright test tests/exploratory/ --debug
```
- Opens Playwright Inspector
- Pause and resume test execution
- Inspect DOM in real-time

### Headed Mode (Browser Window)
```bash
npx playwright test tests/exploratory/ --headed
```
- Shows browser window during execution
- No debugger UI
- Good for visual verification

---

## ⚙️ Configuration

### Timeout Settings
Edit `playwright.config.ts`:

```typescript
use: {
  actionTimeout: 10000,        // 10 seconds for actions
  navigationTimeout: 30000,    // 30 seconds for navigation
},
timeout: 30000,                // 30 seconds per test
```

### Parallel Execution
```bash
# Run tests with 4 workers (default is based on CPU cores)
npx playwright test tests/exploratory/ --workers=4

# Run tests serially (1 worker)
npx playwright test tests/exploratory/ --workers=1
```

### Browser Selection
```bash
# Run on Chromium only
npx playwright test tests/exploratory/ --project=chromium

# Run on all browsers (Chromium, Firefox, WebKit)
npx playwright test tests/exploratory/ --project=chromium --project=firefox --project=webkit

# Run on specific browsers
npx playwright test tests/exploratory/ --project=firefox
```

---

## 📈 Performance Benchmarks

Expected execution times (headless, single worker):

| Test Group | Count | Duration | Per Test Avg |
|-----------|-------|----------|-------------|
| Navigation | 2 | ~10s | 5.0s |
| Text Box | 3 | ~15s | 5.0s |
| Checkbox & Radio | 2 | ~12s | 6.0s |
| Practice Form | 2 | ~20s | 10.0s |
| Alerts & Windows | 2 | ~18s | 9.0s |
| Widgets Controls | 3 | ~22s | 7.3s |
| Interactions | 2 | ~18s | 9.0s |
| Data Tables | 2 | ~22s | 11.0s |
| Widgets Advanced | 3 | ~22s | 7.3s |
| Frames & Dynamic | 4 | ~28s | 7.0s |
| **TOTAL** | **25** | **~190s (3.2 min)** | **7.6s** |

---

## 🛠️ Selector Strategy

All tests follow Playwright best practices for element selection:

### Priority Order (in code)
1. **getByRole()** - Semantic ARIA roles (buttons, headings, tabs, etc.)
   ```typescript
   getByRole('button', { name: 'Submit' })
   getByRole('heading', { name: 'Form Title' })
   ```

2. **getByTestId()** - Test ID attributes
   ```typescript
   getByTestId('submit-btn')
   ```

3. **getByText() / getByLabel()** - Visible text or labels
   ```typescript
   getByText('Click here')
   getByLabel('Email Address')
   ```

4. **getByPlaceholder()** - Input placeholders
   ```typescript
   getByPlaceholder('Enter your name')
   ```

5. **CSS Selectors** - Last resort only
   ```typescript
   locator('#my-id')
   locator('.my-class')
   ```

### NO XPath or Hardcoded Sleeps
- ❌ Do NOT use XPath: `//button[@id='submit']`
- ❌ Do NOT hardcode waits: `page.waitForTimeout(1000)`
- ✅ Use Playwright auto-waiting with expectations

---

## 🧪 Test Pattern: Arrange-Act-Assert

All tests follow the AAA pattern:

```typescript
test('Example test', async ({ page }) => {
  // ARRANGE: Setup and navigate
  const formPage = new FormPage(page);
  await formPage.goto();

  // ACT: Perform user actions
  await formPage.fillField('email', 'test@example.com');
  await formPage.clickSubmit();

  // ASSERT: Verify expected results
  await expect(page).toHaveURL(/success/);
  const message = page.locator('.success-message');
  await expect(message).toBeVisible();
});
```

---

## 📋 Test Data

Tests use realistic test data values:

```typescript
// Text inputs
const testName = 'John Doe';
const testEmail = 'john.doe@example.com';
const testPhone = '9876543210';

// Form fields
const testData = {
  firstName: 'Robert',
  lastName: 'Brown',
  email: 'robert@example.com',
  age: '32',
  salary: '55000',
  department: 'QA'
};

// Special test cases
const xssPayload = '<script>alert("XSS")</script>';
const specialChars = '!@#$%^&*()';
```

---

## 🐛 Troubleshooting

### Test Timeouts
If tests timeout, check:
1. Network connectivity
2. Application server is running (`https://demoqa.com` is accessible)
3. Increase timeout in `playwright.config.ts`

```bash
# Test with verbose output
npx playwright test tests/exploratory/ --verbose
```

### Flaky Tests
Tests may be flaky due to:
1. Timing issues with animations
2. Network latency
3. Dynamic element rendering

**Solution**: Tests already include `waitForLoadState()` and strategic waits

### Failed Assertions
Check the HTML report for:
1. Screenshots at failure point
2. Video recording (if enabled)
3. Trace files for debugging

```bash
npx playwright show-report
```

### Element Not Found Errors
Verify:
1. Application is fully loaded
2. Selectors are correct (check with DevTools)
3. Element is not hidden or disabled

---

## 🔐 Security Testing

Tests include security validations:

**TC-025**: XSS Prevention
- Sends JavaScript payloads in form fields
- Verifies payloads are NOT executed
- Confirms content is displayed safely

---

## 📱 Mobile Testing

**TC-021**: Responsive Design
- Tests at iPhone SE viewport (375x667)
- Verifies no horizontal scrolling
- Checks touch-friendly element sizes (44x44px minimum)

---

## 📊 Reporting

### HTML Report
```bash
npx playwright test tests/exploratory/
npx playwright show-report
```

### JSON Report
```bash
npx playwright test tests/exploratory/ --reporter=json > test-results.json
```

### JUnit Report (CI/CD)
```bash
npx playwright test tests/exploratory/ --reporter=junit
```

### Custom Report Script
```bash
npx playwright test tests/exploratory/ --reporter=json | python parse-results.py
```

---

## 🔄 CI/CD Integration

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
      - run: npm ci
      - run: npx playwright install
      - run: npx playwright test playwright/tests/exploratory/
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📚 Page Object Models Used

Tests use existing page objects in `playwright/pages/`:

- `base.page.ts` - Base class with navigation
- `home.page.ts` - Homepage
- `elements-text-box.page.ts` - Text box form
- `elements-checkbox.page.ts` - Checkbox component
- `elements-radio-button.page.ts` - Radio buttons
- `forms-student-registration.page.ts` - Practice form
- `alerts.page.ts` - Alert dialogs
- And others...

Each page object exposes methods for user actions:
```typescript
await textBoxPage.fillForm({ name: 'John', email: 'john@example.com' });
await formPage.submitForm();
await alertsPage.acceptAlert();
```

---

## 📝 Maintenance

### Updating Selectors
When UI changes break tests:

1. **Identify broken test**: Check test report
2. **Inspect new selector**: Use browser DevTools
3. **Update page object**: Modify `*.page.ts` file
4. **Verify selector**: Run affected test

Example update:
```typescript
// OLD: page.locator('#submit-btn')
// NEW: page.getByRole('button', { name: 'Submit' })
```

### Adding New Tests
1. Create new spec file in `tests/exploratory/`
2. Use existing page objects or create new ones
3. Follow Arrange-Act-Assert pattern
4. Add test case ID in title: `[TC-XXX]`
5. Add tags: `@smoke`, `@high`, etc.

---

## ✅ Success Criteria

All tests pass if:
- ✅ All 25 test cases execute successfully
- ✅ Zero assertion failures
- ✅ Zero timeout errors
- ✅ Execution time < 5 minutes
- ✅ All tags working correctly

```
25 tests passed in 3.2 minutes ✅
```

---

## 📞 Support

For issues or questions:
1. Check test report: `npx playwright show-report`
2. Enable debug mode: `npx playwright test --debug`
3. Check application: https://demoqa.com (must be accessible)
4. Review page objects: `playwright/pages/`

---

## 📄 License

These tests are part of the DemoQA automation suite.

---

**Last Updated**: 2026-04-09T19:44:19Z  
**Version**: 1.0  
**Status**: ✅ PRODUCTION READY
