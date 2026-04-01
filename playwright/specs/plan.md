# Test Plan: DemoQA Application

## 1. Element Interactions - Text Input & Submission
**Seed:** `tests/generated/elements-text-box.spec.ts`

### 1.1 Fill and Submit Text Box Form
**Steps:**
1. Navigate to https://demoqa.com/text-box
2. Fill in the Full Name field with "John Doe"
3. Fill in the Email field with "john@example.com"
4. Fill in the Current Address textarea with "123 Main St, New York"
5. Fill in the Permanent Address textarea with "456 Oak Ave, Boston"
6. Click the Submit button
7. Verify the form submission feedback appears

**Expected:** Form submits successfully and displays confirmation message

### 1.2 Validate Email Field
**Steps:**
1. Navigate to https://demoqa.com/text-box
2. Fill in the Full Name field with "Jane Smith"
3. Fill in the Email field with "invalid-email"
4. Click the Submit button
5. Verify validation behavior

**Expected:** Form may show validation feedback or accept submission

---

## 2. Element Interactions - Checkboxes
**Seed:** `tests/generated/elements-checkbox.spec.ts`

### 2.1 Expand and Select Checkboxes
**Steps:**
1. Navigate to https://demoqa.com/checkbox
2. Click the "Expand All" button if available, or expand the root folder
3. Select multiple checkboxes (e.g., Documents, Desktop)
4. Verify selected items are displayed
5. Click a checkbox to deselect it
6. Verify deselection works

**Expected:** Checkboxes can be selected and deselected, selections are tracked

---

## 3. Element Interactions - Radio Buttons
**Seed:** `tests/generated/elements-radio-button.spec.ts`

### 3.1 Select Radio Button Options
**Steps:**
1. Navigate to https://demoqa.com/radio-button
2. Verify radio buttons are visible
3. Click on the first radio button (e.g., "Yes")
4. Verify the button is selected
5. Click on another radio button (e.g., "No")
6. Verify only the new button is selected

**Expected:** Only one radio button can be selected at a time

---

## 4. Element Interactions - Buttons
**Seed:** `tests/generated/elements-buttons.spec.ts`

### 4.1 Click Button and Verify Response
**Steps:**
1. Navigate to https://demoqa.com/buttons
2. Click the "Click Me" button
3. Verify a response or message appears
4. Click the "Double Click Me" button with a double-click
5. Verify the double-click response
6. Right-click on the "Right Click Me" button
7. Verify the context menu response

**Expected:** Each button click type produces appropriate feedback

---

## 5. Form Automation - Student Registration
**Seed:** `tests/generated/forms-student-registration.spec.ts`

### 5.1 Complete Student Registration Form
**Steps:**
1. Navigate to https://demoqa.com/automation-practice-form
2. Fill in First Name: "Alex"
3. Fill in Last Name: "Johnson"
4. Fill in Email: "alex@example.com"
5. Select Gender: "Male"
6. Fill in Mobile Number: "9876543210"
7. Click on Date of Birth input and select a date
8. Fill in Subjects: "Maths" (with autocomplete)
9. Select Hobbies: "Sports", "Reading"
10. Upload a picture file
11. Fill in Current Address: "789 Elm St"
12. Select State: "NCR"
13. Select City: "Delhi"
14. Click Submit button
15. Verify success modal appears with submitted data

**Expected:** Form submits successfully and shows confirmation with entered data

### 5.2 Submit Form with Minimal Data
**Steps:**
1. Navigate to https://demoqa.com/automation-practice-form
2. Fill only required fields: First Name, Last Name, Gender, Mobile
3. Click Submit
4. Verify appropriate behavior (success or validation error)

**Expected:** Form either submits or shows validation for missing required fields

---

## 6. Table Operations - Web Tables
**Seed:** `tests/generated/elements-webtables.spec.ts`

### 6.1 Add New Entry to Web Table
**Steps:**
1. Navigate to https://demoqa.com/webtables
2. Click the "Add" button
3. Fill in form fields: First Name, Last Name, Email, Age, Salary, Department
4. Submit the form
5. Verify the new entry appears in the table

**Expected:** New record is added to the table and visible in the data grid

### 6.2 Edit Table Entry
**Steps:**
1. Navigate to https://demoqa.com/webtables
2. Locate an existing row
3. Click the Edit button for that row
4. Modify a field (e.g., salary)
5. Submit the form
6. Verify changes are reflected in the table

**Expected:** Table entry is updated successfully

### 6.3 Delete Table Entry
**Steps:**
1. Navigate to https://demoqa.com/webtables
2. Locate a row with a Delete button
3. Click the Delete button
4. Verify the row is removed from the table

**Expected:** Record is deleted from the table

---

## 7. Alerts & Dialogs
**Seed:** `tests/generated/alerts-windows.spec.ts`

### 7.1 Handle Simple Alert
**Steps:**
1. Navigate to https://demoqa.com/alerts
2. Click the "Click for alert" button
3. Verify alert dialog appears
4. Accept the alert
5. Verify alert is dismissed

**Expected:** Alert displays and can be dismissed

### 7.2 Handle Confirm Dialog
**Steps:**
1. Navigate to https://demoqa.com/alerts
2. Click the "On button click, confirm box will appear" button
3. Click OK in the confirmation dialog
4. Verify result message displays

**Expected:** Confirmation dialog appears and result is handled

### 7.3 Handle Prompt Dialog
**Steps:**
1. Navigate to https://demoqa.com/alerts
2. Click the "On button click, prompt will appear" button
3. Enter text in the prompt
4. Click OK
5. Verify the entered text is displayed in the result

**Expected:** Prompt accepts input and displays entered value

---

## 8. Browser Window Interactions
**Seed:** `tests/generated/alerts-browser-windows.spec.ts`

### 8.1 New Window/Tab Handling
**Steps:**
1. Navigate to https://demoqa.com/browser-windows
2. Click the "New Window" button
3. Wait for new window to open
4. Verify new window URL
5. Close new window
6. Verify focus returns to original window

**Expected:** New window opens and closes successfully

---

## 9. Links & Navigation
**Seed:** `tests/generated/elements-links.spec.ts`

### 9.1 Navigate via Link
**Steps:**
1. Navigate to https://demoqa.com/links
2. Click on a link (e.g., "Home")
3. Verify navigation to the target URL
4. Navigate back
5. Verify return to links page

**Expected:** Links navigate to correct destinations

---

## 10. Widgets - Accordions
**Seed:** `tests/generated/widgets-accordion.spec.ts`

### 10.1 Expand and Collapse Accordion Sections
**Steps:**
1. Navigate to https://demoqa.com/accordian
2. Verify accordion sections are visible
3. Click on first accordion header to expand
4. Verify content is displayed
5. Click on another accordion header
6. Verify first collapses and second expands (single-open behavior)
7. Click the expanded header to collapse
8. Verify content is hidden

**Expected:** Accordion sections expand/collapse with proper single-open behavior

---

## 11. Widgets - Auto-Complete
**Seed:** `tests/generated/widgets-autocomplete.spec.ts`

### 11.1 Test Autocomplete Input
**Steps:**
1. Navigate to https://demoqa.com/auto-complete
2. Click on the single-value autocomplete field
3. Type "Red" to trigger suggestions
4. Select a suggestion from the dropdown
5. Verify selected value is displayed
6. Click on the multi-value autocomplete field
7. Type "Blue" and select from suggestions
8. Type "Green" and select another option
9. Verify multiple values are displayed

**Expected:** Autocomplete fields show suggestions and allow selection

---

## 12. Books & Search
**Seed:** `tests/generated/books-search.spec.ts`

### 12.1 Search and Filter Books
**Steps:**
1. Navigate to https://demoqa.com/books
2. Verify book list is displayed
3. Use search functionality to find books by keyword
4. Verify filtered results are shown
5. Clear search and verify full list returns

**Expected:** Search filters books correctly and displays results

---

## 13. Upload & Download
**Seed:** `tests/generated/elements-upload-download.spec.ts`

### 13.1 Download File
**Steps:**
1. Navigate to https://demoqa.com/upload-download
2. Click Download button
3. Verify file download is triggered
4. Verify downloaded file exists

**Expected:** File downloads successfully

### 13.2 Upload File
**Steps:**
1. Navigate to https://demoqa.com/upload-download
2. Click "Choose File" button
3. Select a test file
4. Verify upload is confirmed

**Expected:** File upload succeeds

---

## 14. Dynamic Properties
**Seed:** `tests/generated/elements-dynamic-properties.spec.ts`

### 14.1 Verify Dynamic Button Enable/Disable
**Steps:**
1. Navigate to https://demoqa.com/dynamic-properties
2. Verify "Will enable 5 seconds" button is initially disabled
3. Wait for 5 seconds
4. Verify button becomes enabled
5. Click the button
6. Verify button click response

**Expected:** Button becomes enabled after wait period

---

## 15. Frames
**Seed:** `tests/generated/alerts-frames.spec.ts`

### 15.1 Interact with iframe Content
**Steps:**
1. Navigate to https://demoqa.com/frames
2. Verify frame is loaded
3. Locate content within the frame
4. Verify frame content is accessible and readable

**Expected:** Frame content is accessible and interactable

---

## 16. Modal Dialogs
**Seed:** `tests/generated/alerts-modal-dialogs.spec.ts`

### 16.1 Open and Close Modal Dialog
**Steps:**
1. Navigate to https://demoqa.com/modal-dialogs
2. Click "Small Modal" button
3. Verify modal appears
4. Click Close button in modal
5. Verify modal is dismissed

**Expected:** Modal opens and closes successfully

### 16.2 Large Modal Content
**Steps:**
1. Navigate to https://demoqa.com/modal-dialogs
2. Click "Large Modal" button
3. Verify large modal content is visible
4. Scroll if necessary to see all content
5. Click Close or outside modal
6. Verify modal closes

**Expected:** Large modal displays full content and closes

---

## Test Execution Priorities

### Smoke Tests (Must Pass)
- 1.1 Fill and Submit Text Box Form
- 3.1 Select Radio Button Options
- 5.1 Complete Student Registration Form

### Regression Tests (Critical Paths)
- 2.1 Expand and Select Checkboxes
- 4.1 Click Button and Verify Response
- 6.1 Add New Entry to Web Table
- 7.1 Handle Simple Alert

### Extended Tests (Feature Coverage)
- All remaining scenarios for comprehensive coverage

---

**Plan Generated:** 2026-04-01
**Target Application:** https://demoqa.com
**Framework:** Playwright (TypeScript)
