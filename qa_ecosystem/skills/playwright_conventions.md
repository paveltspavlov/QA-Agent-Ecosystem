## Playwright Conventions

### Selector Strategy

Use selectors in strict priority order:

1. **`getByRole()`** — BEST: use ARIA roles and accessible names (e.g., `getByRole('button', { name: 'Submit' })`)
2. **`getByTestId()`** — GOOD: use `data-testid` attributes when roles are ambiguous
3. **`getByText()` / `getByLabel()`** — ACCEPTABLE: for visible text or form labels
4. **CSS selectors** — LAST RESORT: only when no semantic alternative exists
5. **XPath** — NEVER: do not use XPath selectors under any circumstances

### Waiting Strategy

- **NEVER** use hardcoded sleeps (`page.waitForTimeout`, `setTimeout`, `sleep`)
- Rely on Playwright's built-in auto-waiting for all actions and assertions
- Use `expect(locator).toBeVisible()` or `expect(locator).toHaveText()` for explicit waits
- Use `page.waitForURL()` or `page.waitForResponse()` for navigation and network events

### Page Object Model Architecture

1. **BasePage** (`base.page.ts`):
   - Constructor accepts `Page` instance
   - Navigation helpers: `goto(path)`, `waitForPageLoad()`
   - Screenshot helpers: `takeScreenshot(name)`
   - Common assertions: `expectTitle(title)`, `expectUrl(pattern)`

2. **Feature Pages** (e.g., `login.page.ts`, `dashboard.page.ts`):
   - Extend `BasePage`
   - Define page-specific locators as `readonly` properties
   - Expose user-action methods (`fillLoginForm`, `submitSearch`, `selectFilterOption`)
   - Return next page object from navigation actions for fluent chaining

3. **Component Objects** (e.g., `header.component.ts`, `modal.component.ts`):
   - Encapsulate reusable UI components shared across pages
   - Accept a parent locator scope to avoid selector collisions

### File Naming & Structure

- Test files: `*.spec.ts` — never `*.test.ts` or `*.e2e.ts`
- Page objects: `*.page.ts`
- Component objects: `*.component.ts`
- Fixtures: `*.fixture.ts`
- Timeout constants: import from a shared helpers file, never hardcode numbers
- Follow Arrange-Act-Assert pattern in every test
- Tag every test: @ui, @smoke, @regression for CI filtering

### Test Organization

- Group tests with `test.describe()` by feature or user journey
- Use `test.beforeEach()` and `test.afterEach()` for setup/teardown
- Smoke tests must be independent and fast (< 30 seconds each)
- Use named timeout constants: SHORT (3s), MEDIUM (5s), LONG (10s), NAVIGATION (15s)
