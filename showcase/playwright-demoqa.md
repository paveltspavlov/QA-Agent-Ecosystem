# Workflow 4 -- Playwright Test Generation for DemoQA

Run Workflow 4 — Playwright Test Generation.

## Target Application

- App URL: https://demoqa.com
- App type: SPA (React-based demo application by ToolsQA)

## Pages to Cover

### Elements Section
- Text Box (https://demoqa.com/text-box) -- form with full name, email, current/permanent address
- Check Box (https://demoqa.com/checkbox) -- expandable tree with checkboxes
- Radio Button (https://demoqa.com/radio-button) -- Yes/Impressive/No options
- Web Tables (https://demoqa.com/webtables) -- CRUD table with add/edit/delete/search/pagination
- Buttons (https://demoqa.com/buttons) -- double click, right click, single click
- Links (https://demoqa.com/links) -- internal and API call links
- Dynamic Properties (https://demoqa.com/dynamic-properties) -- buttons that enable/change after delay

### Forms Section
- Practice Form (https://demoqa.com/automation-practice-form) -- complete registration form with all input types

### Alerts, Frames & Windows
- Browser Windows (https://demoqa.com/browser-windows) -- new tab, new window, message window
- Alerts (https://demoqa.com/alerts) -- simple alert, timed alert, confirm, prompt
- Frames (https://demoqa.com/frames) -- nested iframes
- Modal Dialogs (https://demoqa.com/modal-dialogs) -- small and large modal

### Widgets
- Accordian (https://demoqa.com/accordian) -- collapsible sections
- Auto Complete (https://demoqa.com/auto-complete) -- single and multi-value autocomplete
- Date Picker (https://demoqa.com/date-picker) -- date and date-time pickers
- Slider (https://demoqa.com/slider) -- range slider
- Progress Bar (https://demoqa.com/progress-bar) -- animated progress bar with start/stop/reset
- Tabs (https://demoqa.com/tabs) -- tab navigation
- Tool Tips (https://demoqa.com/tool-tips) -- hover tooltips on buttons, fields, links
- Menu (https://demoqa.com/menu) -- nested dropdown menus
- Select Menu (https://demoqa.com/select-menu) -- various select/dropdown types

### Interactions
- Sortable (https://demoqa.com/sortable) -- drag-and-drop list and grid sorting
- Selectable (https://demoqa.com/selectable) -- click-to-select list and grid items
- Resizable (https://demoqa.com/resizable) -- resizable boxes with constraints
- Droppable (https://demoqa.com/droppable) -- drag and drop with accept/prevent/revert
- Dragabble (https://demoqa.com/dragabble) -- free and axis-constrained dragging

## Authentication

- No authentication required (public demo site)

## Priority Flows

1. Text Box form -- fill all fields, submit, verify output matches input
2. Web Tables -- add a new row, edit it, search for it, delete it
3. Practice Form -- complete the full registration form with all field types
4. Alerts -- handle all four alert types (simple, timed, confirm, prompt)
5. Date Picker -- select a date, verify it appears in the input
6. Droppable -- drag element to target, verify "Dropped!" text
7. Progress Bar -- start, wait for completion, reset

## Playwright Project

- Path: playwright/
- Browsers: chromium
- Generate page objects in: playwright/pages/
- Generate test specs in: playwright/tests/
- Use fixtures for common setup (navigation, waiting for page load)
