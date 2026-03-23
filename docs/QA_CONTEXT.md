# Playwright Test Framework -- Conventions & Best Practices

This document defines the standards every Playwright test in this project must follow. Agents that generate or review test code use these rules as their source of truth.

---

## Selector Strategy

Use selectors in this priority order:

| Priority | Selector Type | Example | When to Use |
|----------|--------------|---------|-------------|
| 1 | `getByRole` | `page.getByRole('button', { name: 'Submit' })` | Always prefer. Mirrors how users and assistive technology see the page. Resilient to DOM restructuring and CSS class renames. |
| 2 | `getByTestId` | `page.getByTestId('login-form')` | When no accessible role exists or the element is not user-facing (wrappers, containers). Requires `data-testid` attributes in the app. |
| 3 | `getByText` | `page.getByText('Welcome back')` | Static, visible text that is unlikely to change. Avoid for dynamic or localized strings. |
| 4 | CSS selector | `page.locator('.card >> nth=0')` | Last resort for complex structural queries. Keep selectors shallow. |
| **Never** | XPath | -- | Fragile, hard to read, breaks on any DOM change. Banned in this project. |

**Why this order matters:** Role-based selectors couple tests to the user-visible contract of the UI, not its implementation. When the markup changes but the user experience stays the same, role-based selectors keep working. CSS selectors and especially XPath are tightly coupled to DOM structure, making tests brittle.

---

## Wait Patterns

### Banned

```ts
// NEVER do this
await page.waitForTimeout(3000);
```

Hardcoded timeouts make tests slow in fast environments and flaky in slow ones. They are the leading cause of flaky tests.

### Recommended patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| Auto-waiting (default) | Most interactions -- Playwright waits automatically for elements to be actionable | `await page.getByRole('button').click()` |
| `expect().toBeVisible()` | Assert an element appeared after an action | `await expect(page.getByText('Success')).toBeVisible()` |
| `waitForResponse()` | Wait for a specific API call to complete before asserting | `await page.waitForResponse(resp => resp.url().includes('/api/users') && resp.status() === 200)` |
| `waitForURL()` | Wait for navigation to complete | `await page.waitForURL('**/dashboard')` |
| `waitForLoadState()` | Wait for network idle or DOM content loaded | `await page.waitForLoadState('networkidle')` |
| `expect().toHaveURL()` | Assert the current URL after navigation | `await expect(page).toHaveURL(/dashboard/)` |

**Rule:** If you feel the urge to add a `waitForTimeout`, there is always a better event-driven alternative. Find it.

---

## Test Isolation

Every test must be fully independent. No test should rely on another test having run first, and no test should leave state that affects another.

### Rules

1. **No shared mutable state.** Do not use module-level variables that tests read and write.
2. **Each test gets its own context.** Use Playwright's built-in `test` fixture, which provides a fresh `BrowserContext` and `Page` per test by default.
3. **Use fixtures for setup and teardown.** Anything a test needs (authenticated session, seed data, API mocks) must be provided through fixtures, not through `beforeAll` that mutates shared variables.
4. **Clean up after yourself.** If a test creates data via API, the fixture or `afterEach` hook must delete it.
5. **Tests must pass when run alone.** Validate with `npx playwright test path/to/test.spec.ts` for any single file.

```ts
// Good: fixture provides isolated auth state
test('user sees dashboard', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

---

## Test Tagging

### Grouping

Use `test.describe()` to group related tests by feature or page:

```ts
test.describe('Login Page', () => {
  test('shows error on invalid credentials', async ({ page }) => { /* ... */ });
  test('redirects to dashboard on success', async ({ page }) => { /* ... */ });
});
```

### Annotations

Tag tests for selective execution in CI:

| Tag | Meaning | When to Apply |
|-----|---------|---------------|
| `@smoke` | Critical path -- must pass before any deploy | Core user journeys: login, primary CRUD, checkout |
| `@regression` | Full regression coverage | All stable tests |
| `@flaky` | Known intermittent failures under investigation | Tests with open flake-triage issues |
| `@slow` | Execution takes more than 30 seconds | Long E2E flows, performance tests |

```ts
test('user completes checkout @smoke @regression', async ({ page }) => { /* ... */ });

test('renders large dataset @slow @regression', async ({ page }) => { /* ... */ });
```

Run by tag: `npx playwright test --grep @smoke`

---

## Page Object Model

### Structure

All page interactions go through page objects. Tests contain assertions; page objects contain selectors and actions.

```ts
// pages/login.page.ts
export class LoginPage {
  readonly page: Page;
  readonly emailInput = () => this.page.getByRole('textbox', { name: 'Email' });
  readonly passwordInput = () => this.page.getByRole('textbox', { name: 'Password' });
  readonly submitButton = () => this.page.getByRole('button', { name: 'Sign in' });
  readonly errorMessage = () => this.page.getByRole('alert');

  constructor(page: Page) {
    this.page = page;
  }

  async login(email: string, password: string) {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }
}
```

```ts
// tests/login.spec.ts
test('shows error on invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('bad@email.com', 'wrong');
  await expect(loginPage.errorMessage()).toBeVisible();
  await expect(loginPage.errorMessage()).toHaveText(/invalid credentials/i);
});
```

### Rules

- Selectors live in page objects, never in test files.
- Assertions live in test files, never in page objects.
- Page objects expose high-level actions (`login`, `addToCart`), not raw clicks.
- One page object per logical page or major component.
- Shared components (navbar, sidebar) get their own page object.

---

## Data Management

### Rules

1. **Never hardcode test data.** No inline emails, passwords, or IDs in test files.
2. **Use a TestData factory** to generate unique, realistic values per run.
3. **Unique identifiers per test.** Append timestamps or UUIDs to avoid collisions in parallel runs.
4. **Sensitive data** (API keys, passwords) comes from environment variables or `.env` files, never from source code.

```ts
// data/factories/user.factory.ts
export function createTestUser(overrides: Partial<User> = {}): User {
  const id = randomUUID();
  return {
    email: `test-${id}@example.com`,
    name: `Test User ${id.slice(0, 8)}`,
    password: 'SecureP@ss1!',
    ...overrides,
  };
}
```

```ts
// In a test
const user = createTestUser({ name: 'Alice' });
```

---

## Error Handling

### Do

- Rely on Playwright's built-in auto-waiting and retry mechanisms.
- Use `expect` with auto-retrying matchers (`toBeVisible`, `toHaveText`, `toHaveURL`). These retry internally until timeout.
- Let tests fail loudly with clear Playwright error messages. A timeout on `toBeVisible` tells you exactly what was missing.

### Do Not

- Wrap test logic in `try/catch`. This swallows failures and produces false-positive passes.
- Add manual retry loops around assertions. Use Playwright's `expect.toPass()` for custom retry logic if absolutely needed.
- Catch errors just to log them. Playwright's trace and screenshot-on-failure provide better diagnostics.

```ts
// BAD -- hides real failures
try {
  await expect(page.getByText('Success')).toBeVisible();
} catch {
  console.log('Element not found, skipping...');
}

// GOOD -- fails clearly
await expect(page.getByText('Success')).toBeVisible();
```

---

## CI Integration

### Configuration for CI

```ts
// playwright.config.ts (CI overrides)
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

### Rules

| Setting | Value | Reason |
|---------|-------|--------|
| `--reporter=github` | CI only | Annotates failures directly on the PR |
| `retries: 2` | CI only | Catches transient infrastructure flakes without masking real bugs |
| `trace: 'on-first-retry'` | CI only | Captures a full trace on the first retry for post-mortem debugging |
| `screenshot: 'only-on-failure'` | Always | Visual evidence of what went wrong |
| `video: 'retain-on-failure'` | CI only | Full replay of failed tests without bloating storage |
| `workers: '50%'` | CI | Use half available cores to avoid resource contention |

### CI Pipeline Steps

1. Install dependencies: `npm ci`
2. Install browsers: `npx playwright install --with-deps`
3. Run tests: `npx playwright test --reporter=github`
4. Upload artifacts: traces, screenshots, and videos from `test-results/`

---

## File Structure

```
playwright/
  playwright.config.ts          # Global config, projects, retries, reporters
  global-setup.ts               # One-time setup (auth state caching, DB seeding)
  global-teardown.ts            # One-time cleanup after all tests

  fixtures/
    base.fixture.ts             # Extended test fixture with custom pages/helpers
    auth.fixture.ts             # Authenticated context fixtures per role

  pages/
    login.page.ts               # Page object: Login
    dashboard.page.ts           # Page object: Dashboard
    components/
      navbar.component.ts       # Shared component: Navigation bar
      modal.component.ts        # Shared component: Modal dialog

  data/
    factories/
      user.factory.ts           # Factory: User entity
      order.factory.ts          # Factory: Order entity
    constants.ts                # Shared enums, static lookup values

  tests/
    auth/
      login.spec.ts             # Tests: Login flows
      logout.spec.ts            # Tests: Logout flows
    dashboard/
      dashboard.spec.ts         # Tests: Dashboard features
    api/
      users-api.spec.ts         # Tests: /api/users endpoints

  utils/
    api-helpers.ts              # Direct API call utilities for setup/teardown
    test-data-cleanup.ts        # Data cleanup routines

  .env.test                     # Environment variables for test runs (not committed)
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Test files | `<feature>.spec.ts` | `login.spec.ts` |
| Page objects | `<page>.page.ts` | `dashboard.page.ts` |
| Components | `<name>.component.ts` | `navbar.component.ts` |
| Factories | `<entity>.factory.ts` | `user.factory.ts` |
| Fixtures | `<scope>.fixture.ts` | `auth.fixture.ts` |
| Test descriptions | Behavior-focused sentence | `'shows error when password is too short'` |
