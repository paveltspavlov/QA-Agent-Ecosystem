# Showcase Examples

Complete, ready-to-run input files for demonstrating the QA Agent Ecosystem. No placeholders -- just copy the command and run.

## Quick Demo (single agents)

```bash
# Generate test cases from a real PBI (~2 min)
qa-agent run test-case-generator -i showcase/pbi-shopping-cart.md

# Analyze requirements for ambiguities (~1 min)
qa-agent run requirements-analyst -i showcase/pbi-shopping-cart.md

# Generate Playwright tests for demoqa.com (~3 min)
qa-agent run playwright-test-generator -i showcase/playwright-demoqa.md

# Design page objects for an e-commerce checkout (~2 min)
qa-agent run ui-test-designer -i showcase/ui-checkout-flow.md

# Build an API coverage matrix (~2 min)
qa-agent run api-coverage-planner -i showcase/api-bookstore.md

# Diagnose flaky tests (~2 min)
qa-agent run flake-triage -i showcase/flaky-checkout-tests.md
```

## Full Orchestration Demos

```bash
# Workflow 1: New feature -- full QA cycle from PBI to test report
qa-agent orchestrate -i showcase/pbi-shopping-cart.md

# Workflow 4: Playwright generation pipeline for demoqa.com
qa-agent orchestrate -i showcase/playwright-demoqa.md --workflow playwright-gen

# Workflow 5: Flaky test investigation and fix
qa-agent orchestrate -i showcase/flaky-checkout-tests.md

# Workflow 7: API test coverage for the DemoQA Bookstore API
qa-agent orchestrate -i showcase/api-bookstore.md

# Workflow 8: Security audit of the Playwright test codebase
qa-agent orchestrate -i showcase/security-audit-playwright.md

# Workflow 10: Full test health audit
qa-agent orchestrate -i showcase/health-audit-ecommerce.md

# Workflow 14: Release sign-off checklist
qa-agent orchestrate -i showcase/release-signoff-v3.md
```

## Target Applications

| App | URL | Used In |
|-----|-----|---------|
| DemoQA | https://demoqa.com | Playwright generation, UI tests, Bookstore API |
| SauceDemo | https://www.saucedemo.com | E-commerce checkout, flaky tests, health audit |
