## Waiting Strategy

- **NEVER** use hardcoded sleeps (`page.waitForTimeout`, `setTimeout`, `sleep`)
- Rely on Playwright's built-in auto-waiting for all actions and assertions
- Use `expect(locator).toBeVisible()` or `expect(locator).toHaveText()` for explicit waits
- Use `page.waitForURL()` or `page.waitForResponse()` for navigation and network events
