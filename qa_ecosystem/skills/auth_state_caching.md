## Auth State Caching

1. Save authenticated browser state to avoid repeated logins:
   - Use `storageState` to save cookies and localStorage after login
   - Store auth state in `.auth/` directory (gitignored)
   - Create separate auth states for different roles (`admin`, `user`, `guest`)

2. Playwright global setup pattern:
   - Global setup script logs in once and saves `storageState`
   - Tests reference saved state: `use: { storageState: '.auth/admin.json' }`
   - Refresh auth state on expiry (check token validity in setup)

3. Custom auth fixture:
   - Create fixtures in `*.fixture.ts` files extending base test
   - Auth fixture: log in once, save `storageState`, reuse across tests
   - Example: `export const test = base.extend<{ authenticatedPage: Page }>({ ... })`
