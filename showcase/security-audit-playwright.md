# Workflow 8 -- Security Audit of Playwright Test Codebase

Run Workflow 8 — Security Audit.

## Scope

Full Playwright test codebase -- all files under `playwright/`.

## Codebase Path

playwright/

## Areas of Concern

### 1. Hardcoded Credentials
The test suite authenticates against https://www.saucedemo.com using credentials that may be hardcoded directly in test files or page objects. Check for:
- Passwords in `.spec.ts` files
- API keys or tokens in helper files
- Auth state files committed to the repo (`.auth/` directory)
- `.env` or `.env.test` files containing secrets

### 2. Sensitive Data in Test Fixtures
Test data factories may generate realistic-looking PII (emails, phone numbers, addresses) that could be confused with real data. Check for:
- Real email domains (not `@example.com`) in test data
- Phone numbers that could be real
- Addresses that could be real

### 3. Unsafe Dependencies
- Check `package.json` and `package-lock.json` for known CVEs
- Flag outdated Playwright version (current: 1.42.1, check for security patches)
- Check for unnecessary dependencies that expand the attack surface

### 4. Test Output Artifacts
- Screenshots and traces saved to `test-results/` may contain sensitive page content
- Check if `test-results/` is in `.gitignore`
- Check if `playwright-report/` is in `.gitignore`

### 5. Configuration Weaknesses
- `playwright.config.ts`: check for `ignoreHTTPSErrors: true` (disables cert validation)
- Check for `bypassCSP: true` (bypasses Content Security Policy)
- Check for overly permissive `permissions` grants in browser context

### 6. External URL Access
- Identify all external URLs accessed during tests
- Flag any staging/production URLs that shouldn't be in test code
- Check for URLs with embedded credentials (`https://user:pass@host`)

## Previous Audit

- Date: never (first audit)
- This is a new project, establishing a security baseline
