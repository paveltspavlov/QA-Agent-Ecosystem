## Page Object Model Architecture

1. **BasePage** (`base.page.ts`):
   - Constructor accepts `Page` instance
   - Navigation helpers: `goto(path)`, `waitForPageLoad()`
   - Screenshot helpers: `takeScreenshot(name)`
   - Common assertions: `expectTitle(title)`, `expectUrl(pattern)`
   - Shared utility methods: `scrollToElement(locator)`, `waitForNetworkIdle()`

2. **Feature Pages** (e.g., `login.page.ts`, `dashboard.page.ts`):
   - Extend `BasePage`
   - Define page-specific locators as `readonly` properties
   - Expose user-action methods (`fillLoginForm`, `submitSearch`, `selectFilterOption`)
   - Return next page object from navigation actions for fluent chaining

3. **Component Objects** (e.g., `header.component.ts`, `modal.component.ts`):
   - Encapsulate reusable UI components shared across pages
   - Accept a parent locator scope to avoid selector collisions

Output:
- Create `*.page.ts` files with classes encapsulating page interactions
- Each page class exposes methods for user actions (`login`, `fillForm`, `submitOrder`)
- Locators are defined as `readonly` properties on the page class
- Page methods return the next page object for fluent chaining where appropriate
