# Workflow 5 -- Flaky Test Investigation

Run Workflow 5 — Flaky Test Investigation.

## Flaky Tests

- [file path] -- "[test name]" fails ~[X]% of runs
- [file path] -- "[test name]" fails on [condition, e.g., "slow CI"]

Example:
- playwright/tests/ui/checkout.spec.ts -- "should complete order" fails ~30% of runs
- playwright/tests/ui/login.spec.ts -- "should redirect after login" fails on slow CI

## Recent CI Run Results

[Paste JSON output, CI log excerpt, or describe failure pattern]

## Environment

- CI provider: [e.g., GitHub Actions, Jenkins]
- Node version: [e.g., 18.17.0]
- Playwright version: [e.g., 1.40.0]
- OS: [e.g., Ubuntu 22.04]

## Known Patterns

[e.g., "Failures correlate with high CI load", "Only fails on webkit"]
