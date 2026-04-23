# Orchestration Workflows

The QA Agent Ecosystem supports 16 predefined DAG-based workflows (defined in `workflows.yaml`) plus orchestrator-driven workflows via the Test Manager. Each workflow can be run directly from the terminal.

> **Quick start:** `qa-agent workflow <key> -i <input> -m copilot-claude-haiku`
>
> Run `qa-agent list-workflows` to see all available workflow keys.
>
> See [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) for the full terminal execution guide with all input methods and advanced options.

> **Copilot users:** the Test Manager will pause mid-workflow and prompt you for input when requirements need clarification (after the `requirements-analyst` step).

### Model Selection

All workflow examples below use `-m copilot-claude-haiku` (fast, cost-efficient) or `-m copilot-gpt4o` (highest quality). You can substitute any model profile from `models.yaml`. Run `qa-agent list-models` to see all options.

---

## Workflow 1 -- New Feature Testing

**When to use:** Starting QA for a brand-new feature from a PBI or user story.

```
requirements-analyst
  -> request_human_input  (present ambiguities, wait for updated requirements)
  -> test-case-generator
  -> synthetic-data-designer + test-oracle-creator  (parallel)
  -> testware-creator (Test Plan)
  -> Execute
  -> test-results-analyst
  -> testware-creator (Test Report)
```

**CLI:**
```bash
qa-agent workflow feature-testing -i feature_requirements.md -m copilot-claude-haiku
# or full form:
qa-agent orchestrate -w feature-testing -i feature_requirements.md -m copilot-gpt4o
```

**Prompt template** (contents of `feature_requirements.md`):
```
Run Workflow 1 — New Feature Testing.

Feature: [Feature name, e.g., "User Password Reset with Email OTP"]

Requirements:
- [Requirement 1]
- [Requirement 2]
- [Acceptance criteria]

App URL: https://myapp.com
Tech stack: [e.g., React frontend, Node.js REST API, PostgreSQL]
```

---

## Workflow 2 -- Bug Prevention and Root Cause

**When to use:** After a bug cluster or production incident — find the root cause and close the coverage gap.

```
bug-pattern-analyst
  -> requirements-analyst  (spec gaps?)
  -> test-case-generator  (new validations)
  -> regression-optimizer
  -> testware-creator (Defect Report)
```

**CLI:**
```bash
qa-agent workflow bug-prevention -i bug_reports.md -m copilot-claude-haiku
# or: qa-agent orchestrate -w bug-prevention -i bug_reports.md -m copilot-gpt4o
```

**Prompt template:**
```
Run Workflow 2 — Bug Prevention and Root Cause.

Bug reports / incident summary:
- [Bug 1: short description, date, severity]
- [Bug 2: ...]

Affected module: [e.g., "Checkout flow"]
Linked requirements: [PBI-123, PBI-124]
```

---

## Workflow 3 -- Sprint/Release Regression

**When to use:** End of sprint or before a release — build an optimized regression suite.

```
regression-optimizer
  -> synthetic-data-designer
  -> test-oracle-creator  (revalidation criteria)
  -> ai-test-architect  (if AI features are involved)
  -> testware-creator (Test Summary Report)
```

**CLI:**
```bash
qa-agent workflow sprint-regression -i sprint_context.md -m copilot-claude-haiku
# or: qa-agent orchestrate -i sprint_context.md -m copilot-gpt4o
```

**Prompt template:**
```
Run Workflow 3 — Sprint Regression.

Sprint: [Sprint number / release name]
Changed modules: [e.g., "Payments, User Profile, Notifications"]
Existing test suite path: playwright/tests/
Risk areas: [e.g., "Payment gateway integration, session expiry"]
Contains AI features: [yes/no — if yes, describe the AI component]
```

---

## Workflow 4 -- Playwright Test Generation

**When to use:** Automating a web app from scratch or adding automation to a new section.

```
playwright-test-generator  (explore site via CLI, discover pages and user journeys)
  -> ui-test-designer  (create Page Object Model classes)
  -> seed-data-manager  (set up fixtures and data factories)
  -> coverage-hunter  (verify coverage against requirements)
  -> pr-hygiene-checker  (quality gate before commit)
```

**CLI:**
```bash
qa-agent workflow playwright-gen -i "https://myapp.com" -m copilot-claude-haiku
# or with a task file:
qa-agent workflow playwright-gen -i playwright_task.md -m copilot-gpt4o
# or use the dedicated shortcut:
qa-agent playwright-gen --url https://myapp.com -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 4 — Playwright Test Generation.

App URL: https://myapp.com
Pages to cover: [e.g., "Login, Dashboard, User Settings, Checkout"]
Auth: [e.g., "Email + password. Test user: test@example.com / Test1234"]
Priority flows: [e.g., "Login, Add to cart, Complete checkout"]
Playwright project path: playwright/
```

---

## Workflow 5 -- Flaky Test Investigation

**When to use:** CI is showing intermittent test failures that don't reproduce reliably.

```
flake-triage  (diagnose root causes — race conditions, timing, external dependencies)
  -> test-results-analyst  (trend analysis across recent runs)
  -> playwright-test-generator  (rewrite flaky tests with proper waiting strategies)
  -> pr-hygiene-checker  (validate the fix before merge)
```

**CLI:**
```bash
qa-agent workflow flake-investigation -i flaky_tests.md -m copilot-claude-haiku
# or single-agent:
qa-agent playwright-analyze --agent flake-triage -i playwright/tests/ -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 5 — Flaky Test Investigation.

Flaky tests (file paths or test names):
- playwright/tests/ui/checkout.spec.ts — "should complete order" fails ~30% of runs
- playwright/tests/ui/login.spec.ts — "should redirect after login" fails on slow CI

Recent CI run results: [paste JSON output or describe failure pattern]
Environment: [CI provider, Node version, Playwright version]
```

---

## Workflow 6 -- UI Mockup vs Implementation Comparison

**When to use:** Validating that a developed feature matches its design mockup.

```
requirements-analyst  (review requirements + mockup for ambiguities)
  -> request_human_input  (present questions, wait for updated requirements)
  -> playwright-test-generator  (navigate live app, take full-page screenshots)
  -> ui-test-designer  (compare screenshots against mockup, list deviations)
  -> testware-creator  (format each deviation as a Bug Report)
```

**CLI:**
```bash
qa-agent workflow mockup-comparison -i mockup_comparison_task.md -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 6 — UI Mockup vs Implementation Comparison.

App URL: https://myapp.com
Mockup file: designs/feature-login-v2.png
  (or Figma link: https://figma.com/file/...)

Pages / sections to compare:
- Login page (desktop 1280px and mobile 375px)
- Password reset modal
- Dashboard header

Requirements:
- [Requirement 1 relevant to this UI]
- [Acceptance criteria]

For each deviation found, create a bug report following QA best practices.
Save all bug reports to `{bugs_dir}/` (resolves to the active session's bug folder, e.g. `outputs/{app}/{timestamp}/bugs/`).
```

---

## Workflow 7 -- Full API Test Coverage

**When to use:** Planning or auditing REST API test coverage for a service.

```
requirements-analyst  (validate API requirements and spec completeness)
  -> api-coverage-planner  (build coverage matrix: method × endpoint × auth × status codes)
  -> playwright-test-generator  (generate Playwright APIRequestContext test skeletons)
  -> coverage-hunter  (verify all endpoints and edge cases are covered)
  -> pr-hygiene-checker  (quality gate on generated test code)
  -> testware-creator  (API Coverage Report)
```

**CLI:**
```bash
qa-agent workflow api-coverage -i api_coverage_task.md -m copilot-claude-haiku
# or single-agent:
qa-agent playwright-analyze --agent api-coverage-planner -i src/routes/ -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 7 — Full API Test Coverage.

API spec / documentation: [path to OpenAPI spec, e.g., docs/openapi.yaml]
  or describe endpoints:
  - POST /api/auth/login
  - GET  /api/users/:id
  - PUT  /api/users/:id
  - DELETE /api/users/:id

Base URL: https://api.myapp.com
Auth: Bearer token (test token: [token or env var name])
Existing API tests path: playwright/tests/api/
Priority: [e.g., "Focus on auth flows and user CRUD first"]
```

---

## Workflow 8 -- Security Audit

**When to use:** Before a release, after adding new dependencies, or as a regular security hygiene check.

```
security-scout  (scan for hardcoded secrets, unsafe patterns, committed .env files)
  -> coverage-hunter  (check whether security test scenarios exist)
  -> testware-creator  (Security Audit Report: findings by severity, remediation roadmap)
```

**CLI:**
```bash
qa-agent workflow security-audit -i security_audit_task.md -m copilot-claude-haiku
# or single-agent:
qa-agent playwright-analyze --agent security-scout -i playwright/ -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 8 — Security Audit.

Scope: [e.g., "Full repository" or "playwright/ directory only"]
Codebase path: .
Known risk areas: [e.g., "Auth tokens in fixture files, third-party script injection"]
Previous audit date: [date or "never"]
```

---

## Workflow 9 -- Test Data & Fixture Bootstrap

**When to use:** Starting a new feature that requires realistic test data, or when test data is brittle.

```
requirements-analyst  (extract data entities and edge-case values from PBIs)
  -> synthetic-data-designer  (design privacy-safe datasets)
  -> seed-data-manager  (implement fixtures, factories, seeding scripts, teardown)
  -> coverage-hunter  (verify data scenarios cover all acceptance criteria)
  -> testware-creator  (Data Setup Documentation)
```

**CLI:**
```bash
qa-agent workflow data-bootstrap -i data_bootstrap_task.md -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 9 — Test Data & Fixture Bootstrap.

Feature / PBIs: [e.g., "User registration and profile management"]
Data entities needed:
- User (roles: admin, editor, viewer)
- Order (statuses: pending, paid, shipped, cancelled)
- Product (categories: digital, physical)

Edge cases to cover:
- [e.g., "Users with no orders, orders with 100+ items, unicode in names"]

Privacy constraints: [e.g., "No real PII — use faker-generated data only"]
Target path: playwright/test-data/
DB / API seeding method: [e.g., "REST API calls to /api/seed" or "direct DB via Prisma"]
```

---

## Workflow 10 -- Full Test Health Audit

**When to use:** When CI is slow, tests are unreliable, or coverage is unknown.

```
flake-triage  (diagnose unstable tests)
  -> coverage-hunter  (map coverage gaps)
  -> regression-optimizer  (recommend lean regression suite)
  -> pr-hygiene-checker  (quality gate on full test codebase)
  -> testware-creator  (Test Health Report)
```

**CLI:**
```bash
qa-agent workflow test-debt -i health_audit_task.md -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 10 — Full Test Health Audit.

Test directory: playwright/tests/
App URL: https://myapp.com
Recent CI failure rate: [e.g., "~15% of runs have at least one failure"]
Known problem areas: [e.g., "Checkout flow, anything touching date pickers"]
Desired outcome: prioritized action list + lean regression suite recommendation
```

---

## Workflow 11 -- Cross-Browser Compatibility Testing

**When to use:** Verifying features work across Chromium, Firefox, and WebKit.

```
ui-test-designer  (configure multi-browser matrix)
  -> playwright-test-generator  (generate tests for all browser projects)
  -> coverage-hunter  (verify key paths run in every browser)
  -> testware-creator  (Cross-Browser Compatibility Report)
```

**CLI:**
```bash
qa-agent workflow cross-browser -i cross_browser_task.md -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 11 — Cross-Browser Compatibility Testing.

App URL: https://myapp.com
Features to verify: [e.g., "Login, Dashboard, Checkout, File Upload"]
Existing test path: playwright/tests/
Browsers: chromium, firefox, webkit
Known browser-specific issues: [e.g., "File input behaves differently on webkit"]
```

---

## Workflow 12 -- Responsive & Mobile Testing

**When to use:** Verifying layout and interactions at multiple viewport sizes.

```
ui-test-designer  (configure viewport sizes: 375px, 768px, 1280px)
  -> playwright-test-generator  (viewport-specific scenarios and screenshots)
  -> coverage-hunter  (verify all pages tested at every breakpoint)
  -> testware-creator  (Responsive Testing Report)
```

**CLI:**
```bash
qa-agent workflow responsive-testing -i responsive_task.md -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 12 — Responsive & Mobile Testing.

App URL: https://myapp.com
Pages to test: [e.g., "Landing page, Product listing, Cart, Checkout"]
Viewports: 375x812 (mobile), 768x1024 (tablet), 1280x800 (desktop)
Design breakpoints defined at: [e.g., "375px, 768px, 1280px"]
Known responsive issues: [e.g., "Navigation collapses incorrectly on tablet"]
```

---

## Workflow 13 -- AI/ML Feature Testing

**When to use:** Testing features that use ML models, AI-generated content, recommendations, or classifiers.

```
requirements-analyst  (identify non-determinism risks, bias, compliance)
  -> request_human_input  (clarify thresholds and compliance constraints)
  -> ai-test-architect  (design strategy: bias checks, drift detection, adversarial inputs)
  -> test-case-generator  (AI-specific test cases)
  -> synthetic-data-designer  (adversarial, boundary, bias-probe datasets)
  -> testware-creator  (AI Test Strategy Document)
```

**CLI:**
```bash
qa-agent workflow ai-testing -i ai_feature_task.md -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 13 — AI/ML Feature Testing.

Feature: [e.g., "Product recommendation engine", "Sentiment classifier"]
Model type: [e.g., "Collaborative filtering", "LLM-based", "Binary classifier"]
Non-determinism handling: [e.g., "Results may vary by ±5% — use similarity threshold"]
Bias risks: [e.g., "Must not discriminate by gender or age"]
Compliance: [e.g., "GDPR, EU AI Act — explainability required"]
Acceptable accuracy threshold: [e.g., "≥ 90% precision on test set"]
```

---

## Workflow 14 -- Release Sign-off / Go-Live Checklist

**When to use:** Final QA gate before deploying to production.

```
requirements-analyst  (verify all in-scope requirements have test coverage)
  -> regression-optimizer  (risk-prioritized regression subset)
  -> security-scout  (final scan: secrets, unsafe patterns, staging URLs)
  -> coverage-hunter  (confirm coverage meets release threshold)
  -> pr-hygiene-checker  (final quality gate)
  -> testware-creator  (Release Sign-off Report)
```

**CLI:**
```bash
qa-agent workflow release-signoff -i release_signoff_task.md -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 14 — Release Sign-off / Go-Live Checklist.

Release version: v[X.Y.Z]
App URL (staging): https://staging.myapp.com
Scope of changes: [e.g., "New checkout flow, updated user profile"]
Requirements in scope: [PBI-101, PBI-102, PBI-103]
Coverage threshold: [e.g., "≥ 80% of in-scope requirements must have passing tests"]
Regression suite path: playwright/tests/
Sign-off approvers: [e.g., "QA Lead, Product Owner"]
```

---

## Workflow 15 -- End-to-End User Journey Mapping & Automation

**When to use:** Automating full business flows from a user's perspective.

```
requirements-analyst  (extract user journeys from personas)
  -> playwright-test-generator  (explore app, map navigation flows)
  -> ui-test-designer  (implement E2E journey tests with POM)
  -> seed-data-manager  (journey-specific test data and teardown)
  -> coverage-hunter  (verify every journey step is covered)
  -> testware-creator  (User Journey Test Catalogue)
```

**CLI:**
```bash
qa-agent workflow user-journey -i user_journey_task.md -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 15 — End-to-End User Journey Mapping & Automation.

App URL: https://myapp.com
User personas:
  - Guest: browses products, adds to cart, checks out as guest
  - Registered user: logs in, purchases, views order history
  - Admin: manages products, views sales reports

Key business flows to automate:
  1. Guest checkout (browse → cart → payment → confirmation)
  2. Registered user repeat purchase
  3. Admin product catalogue management

Auth credentials: [test credentials per persona]
Playwright project path: playwright/
```

---

## Workflow 16 -- Test Data Cleanup & Maintenance

**When to use:** Fixtures are stale, factories produce collisions, or test data no longer reflects the data model.

```
coverage-hunter  (audit fixtures: stale, duplicate, or incomplete)
  -> seed-data-manager  (remove stale fixtures, consolidate, refresh)
  -> synthetic-data-designer  (redesign datasets for current requirements)
  -> testware-creator  (Data Maintenance Report)
```

**CLI:**
```bash
qa-agent workflow data-cleanup -i data_cleanup_task.md -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 16 — Test Data Cleanup & Maintenance.

Test data path: playwright/test-data/
Fixtures path: playwright/fixtures/
Known issues:
  - [e.g., "User factory produces duplicate emails"]
  - [e.g., "Order fixtures reference deleted product IDs"]
  - [e.g., "Auth fixtures expire after 7 days"]
Current data model changes: [brief description of schema changes since last update]
```

---

## Workflow 17 -- Exploratory Testing Session Planner

**When to use:** Preparing a structured exploratory testing effort.

```
requirements-analyst  (identify ambiguous, high-risk areas)
  -> bug-pattern-analyst  (review historical bugs for exploration priorities)
  -> test-oracle-creator  (define expected behavior and pass/fail criteria)
  -> testware-creator  (Exploratory Testing Charters)
```

**CLI:**
```bash
qa-agent workflow exploratory-planner -i exploratory_task.md -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 17 — Exploratory Testing Session Planner.

Feature / area to explore: [e.g., "New payment flow with 3DS authentication"]
Release date: [date]
Session budget: [e.g., "3 testers × 2 hours each"]
Known risk areas: [e.g., "3DS redirect timing, declined card handling"]
Historical bugs in this area: [describe or attach bug reports]
Tester experience level: [e.g., "1 senior, 2 mid-level"]
```

---

## Workflow 18 -- PR / Code Review QA Gate

**When to use:** Before merging a PR that contains test code changes.

```
pr-hygiene-checker  (11-check quality gate)
  -> security-scout  (scan changed files for secrets)
  -> coverage-hunter  (coverage delta: new code paths without tests)
  -> flake-triage  (flake risk assessment of new/modified tests)
  -> testware-creator  (PR QA Gate Report)
```

**CLI:**
```bash
qa-agent workflow pr-qa-gate -i pr_gate_task.md -m copilot-claude-haiku
# or single-agent:
qa-agent playwright-analyze --agent pr-hygiene-checker -i playwright/tests/ -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 18 — PR / Code Review QA Gate.

PR branch: [branch name]
Changed test files:
  - playwright/tests/ui/checkout.spec.ts  (modified)
  - playwright/pages/checkout.page.ts  (new)
  - playwright/fixtures/order.fixture.ts  (new)
Changed source files: [optional — list for coverage delta analysis]
PR description: [paste PR title and summary]
```

---

## Workflow 19 -- Post-Deployment Smoke Verification

**When to use:** Immediately after deploying — verify critical paths before announcing the release.

```
playwright-test-generator  (identify or generate critical smoke tests)
  -> coverage-hunter  (verify smoke suite covers all critical entry points)
  -> testware-creator  (Smoke Verification Report)
```

**CLI:**
```bash
qa-agent workflow post-deploy-smoke -i smoke_task.md -m copilot-claude-haiku
# or run existing smoke tests directly:
qa-agent playwright-run --project chromium --grep "@smoke" --analyze
```

**Prompt template:**
```
Run Workflow 19 — Post-Deployment Smoke Verification.

Environment: [staging | production]
App URL: https://staging.myapp.com
Deployed version: v[X.Y.Z]
Critical paths to verify:
  - Homepage loads
  - User can log in
  - [Key feature 1] is accessible
  - [Key feature 2] completes successfully
Existing smoke suite path: playwright/tests/  (tag: @smoke)
Maximum acceptable run time: [e.g., "10 minutes"]
```

---

## Workflow 20 -- Requirements Traceability Audit

**When to use:** Ensuring every requirement has at least one test case.

```
requirements-analyst  (catalogue all requirements and acceptance criteria)
  -> coverage-hunter  (map existing tests to requirements, identify gaps)
  -> test-case-generator  (generate missing test cases)
  -> testware-creator  (Traceability Matrix)
```

**CLI:**
```bash
qa-agent workflow traceability -i traceability_task.md -m copilot-claude-haiku
```

**Prompt template:**
```
Run Workflow 20 — Requirements Traceability Audit.

Requirements document: requirements/pbi-backlog.md
  (or list requirements inline:)
  - REQ-001: User can register with email and password
  - REQ-002: User receives a confirmation email after registration
  - REQ-003: User can log in with registered credentials
  - REQ-004: User can reset password via email link

Existing test directory: playwright/tests/
Desired output: Traceability Matrix showing which tests cover which requirements,
and a list of requirements with zero test coverage.
```

---

## Workflow 21 -- PBI to Report — Full Pipeline

**When to use:** You have a PBI or user story and want the full journey: analyze requirements, generate test cases, automate and execute Playwright tests, log bugs, and get a comprehensive report with token consumption.

```
requirements-analyst  (analyze PBI for ambiguities and testable requirements)
  -> test-case-generator  (ISTQB test cases from clarified requirements)
  -> playwright-test-generator  (create automated Playwright tests from test cases)
  -> playwright-executor  (run tests, collect traces, diagnose failures)
  -> bug-reporter + test-results-analyst  (parallel: log bugs and analyze results)
  -> report-creator  (comprehensive report with task descriptions, results, and total consumed tokens)
```

**CLI:**
```bash
qa-agent workflow pbi-to-report -i inputs/pbi-to-report.md -m copilot-claude-haiku
```

**Or via the Test Manager orchestrator:**
```bash
qa-agent orchestrate -w pbi-to-report -i inputs/pbi-to-report.md -m copilot-claude-haiku
```

**Test Manager prompt (natural language — the orchestrator selects the right agents):**
```
Analyze the following PBI, generate test cases, create and execute automated
Playwright tests, log any bugs found, and produce a final execution report
including token consumption.

PBI: "As a registered user I want to reset my password via email so that
I can regain access to my account."

Acceptance criteria:
1. User receives a reset email within 30 seconds
2. Reset link expires after 24 hours
3. New password must meet complexity requirements

App URL: https://demoqa.com
Playwright project path: playwright/
```

**Prompt template** (contents of `inputs/pbi-to-report.md`):
```
Run the PBI-to-Report workflow — end-to-end from requirements analysis
to final execution report.

PBI / User Story:
  [Paste the full PBI or user story]

Acceptance Criteria:
  1. [Criterion 1]
  2. [Criterion 2]
  3. [Criterion 3]

App URL: [https://myapp.com]
Tech stack: [e.g., React frontend, Node.js REST API]
Playwright project path: playwright/
Test credentials: [e.g., test@example.com / Test1234]
Priority flows: [e.g., "Happy path, invalid email, expired link"]
Severity threshold: [e.g., "Log all, create issues for Critical/High only"]
```

### Step-by-Step Breakdown

| Step | Agent | Input | Output |
|------|-------|-------|--------|
| 1 | `requirements-analyst` | Raw PBI / user story | Clarified requirements with gap analysis |
| 2 | `test-case-generator` | Clarified requirements | ISTQB test cases (IDs, steps, expected results) |
| 3 | `playwright-test-generator` | Test cases + app URL | Playwright TypeScript test files (.spec.ts) |
| 4 | `playwright-executor` | Generated test files | Execution results (pass/fail, traces, logs) |
| 5 | `bug-reporter` | Execution results (failures) | Structured bug reports (JSON + markdown) |
| 6 | `test-results-analyst` | Execution results (all) | Failure patterns, quality trends, flaky test flags |
| 7 | `report-creator` | Results from steps 4-6 | Final HTML/markdown report with token consumption |

### Using the Test Manager as Orchestrator

The Test Manager (`test-manager` agent) can orchestrate this entire pipeline from a single natural-language instruction. It will:

1. Parse your objective and select the `pbi-to-report` workflow
2. Present the execution plan for your approval
3. Delegate to each agent in sequence, passing outputs forward
4. Pause after `requirements-analyst` if ambiguities are found (human-in-the-loop)
5. Run `bug-reporter` and `test-results-analyst` in parallel after execution
6. Consolidate all outputs into the final `report-creator` step

**Example orchestrator command:**
```bash
qa-agent workflow pbi-to-report -m copilot-claude-haiku -i - <<'EOF'
I have a PBI for password reset functionality on https://demoqa.com.
Analyze the requirements, generate test cases, automate them with Playwright,
execute the tests, log all bugs, and give me a final report with token usage.

PBI: As a registered user, I want to reset my password via email link.
Acceptance criteria:
- Reset email sent within 30 seconds
- Link expires after 24 hours
- New password must be 8+ chars with uppercase, lowercase, and number
EOF
```
