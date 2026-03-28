# Workflow 10 -- Full Test Health Audit: SauceDemo E-Commerce Suite

Run Workflow 10 — Full Test Health Audit.

## Test Directory

playwright/tests/

## Application

- App URL: https://www.saucedemo.com
- Type: React SPA (e-commerce demo)
- Pages: Login, Inventory, Cart, Checkout (3 steps), Checkout Complete

## Current State

- Total tests: ~45 across 8 spec files
- Recent CI failure rate: ~40% of runs have at least one failure
- Average run time: 4 minutes (chromium only)
- Retries: 1 in CI (masks some flakiness)
- Last green streak: 3 consecutive runs (runs #139-#141)

## Test File Inventory

```
playwright/tests/
├── ui/
│   ├── login.spec.ts          -- 8 tests (login flows, all users)
│   ├── inventory.spec.ts      -- 10 tests (product listing, sorting, filtering)
│   ├── cart.spec.ts           -- 9 tests (add/remove, persistence, edge cases)
│   ├── checkout.spec.ts       -- 7 tests (happy path, validation, edge cases)
│   ├── checkout-complete.spec.ts -- 3 tests (confirmation, back navigation)
│   └── responsive.spec.ts    -- 4 tests (mobile and tablet viewports)
└── api/
    └── (empty -- no API tests yet)
```

## Known Problem Areas

1. **Checkout flow** -- "should complete checkout with multiple items" fails ~35% in CI. Suspected scroll/viewport issue with the Finish button.
2. **Cart price assertions** -- Tests read `textContent()` before React has rendered updated prices, causing "$0.00" vs expected price.
3. **Sort verification** -- Tests read product order immediately after selecting a sort option, before the DOM re-renders.
4. **Cart badge during navigation** -- Badge text is empty briefly during SPA route transitions.
5. **No API tests** -- All testing is UI-based. No coverage for direct API validation.
6. **No mobile/tablet coverage beyond 4 basic responsive tests** -- critical flows only tested on desktop viewport.

## CI Configuration

```yaml
# .github/workflows/playwright.yml
- name: Run Playwright tests
  run: npx playwright test --reporter=github
  env:
    CI: true
```

- Browsers: Chromium only (no Firefox or WebKit)
- Workers: 4
- Retries: 1
- Timeout: 30s per test
- Traces: on-first-retry
- Screenshots: only-on-failure

## Desired Outcome

1. **Flaky test inventory** -- list every flaky test with root cause and confidence level
2. **Coverage gap map** -- what pages, user flows, and edge cases have zero test coverage
3. **Regression suite recommendation** -- which tests to include in a lean @smoke suite
4. **Hygiene score** -- quality gate results across all 45 tests (selectors, assertions, isolation, naming)
5. **Prioritized action list** -- top 10 improvements ranked by impact
