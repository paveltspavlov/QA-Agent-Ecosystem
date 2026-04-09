# Workflow Execution Guide

Complete guide to running QA Agent Ecosystem workflows from the terminal. Each workflow orchestrates multiple AI agents in a dependency-aware sequence (DAG), with parallel execution where possible and checkpoint-based resumption.

---

## Quick Start

```bash
# 1. Install the CLI (if not already)
pip install -e .

# 2. Set up API keys
qa-agent init

# 3. List all available workflows
qa-agent list-workflows

# 4. Run a workflow with input (using copilot-claude-haiku for fast, cost-efficient execution)
qa-agent workflow feature-testing -i requirements.md -m copilot-claude-haiku

# 5. Run with inline text input
qa-agent workflow playwright-gen -i "https://demoqa.com" -m copilot-claude-haiku
```

---

## Command Reference

### `qa-agent workflow` (recommended shorthand)

```bash
qa-agent workflow <WORKFLOW_KEY> -i <INPUT> [OPTIONS]
```

| Flag | Short | Description |
|------|-------|-------------|
| `<WORKFLOW_KEY>` | | Workflow key from `workflows.yaml` (see table below) |
| `--input` | `-i` | **Required.** Input text, file path, or URL |
| `--model` | `-m` | Model profile override (e.g. `copilot-gpt4o`, `claude-sonnet`) |
| `--dry-run` | | Show execution plan without running |
| `--skip` | | Skip specific agents (space-separated) |
| `--resume` | | Resume from a checkpoint file |
| `--notify` | | Webhook URL for completion notification |
| `--cwd` | | Working directory for agents (default: `.`) |

### `qa-agent orchestrate` (full form with advanced options)

```bash
qa-agent orchestrate -w <WORKFLOW_KEY> -i <INPUT> [OPTIONS]
```

Additional flags available only via `orchestrate`:

| Flag | Description |
|------|-------------|
| `--workflow-file` | Use a custom workflow YAML file instead of built-in |
| `--reorder` | Reassign agent indices: `"1:agent-a, 2:agent-b"` |
| `--deps` | Override dependencies: `"2:[1], 3:[1,2]"` |
| `--template` | Prompt template name (default: `default`) |

---

## Input Methods

Workflows accept input in three ways:

### 1. File path
```bash
qa-agent workflow pbi-to-report -i requirements/password-reset.md
```

### 2. Inline text
```bash
qa-agent workflow feature-testing -i "Test the login page with email/password authentication"
```

### 3. URL (auto-detected for web-focused workflows)
```bash
qa-agent workflow playwright-gen -i "https://demoqa.com"
qa-agent workflow exploratory-testing -i "https://staging.myapp.com"
```

### 4. Heredoc / stdin (multi-line instructions)
```bash
qa-agent workflow pbi-to-report -i - <<'EOF'
PBI: As a registered user, I want to reset my password via email link.

Acceptance criteria:
- Reset email sent within 30 seconds
- Link expires after 24 hours
- New password must be 8+ chars with uppercase, lowercase, and number

App URL: https://demoqa.com
Playwright project path: playwright/
EOF
```

### 5. Pipe from another command
```bash
cat sprint-requirements.md | qa-agent workflow feature-testing -i /dev/stdin
```

---

## All Workflows

### 1. `feature-testing` — New Feature Testing

**When to use:** Starting QA for a new feature from a PBI or user story.

**Agent sequence:**
```
requirements-analyst → test-case-generator → synthetic-data-designer (parallel) →
test-oracle-creator (parallel) → testware-creator
```

**Run:**
```bash
qa-agent workflow feature-testing -i feature_requirements.md
```

**Input template:**
```
Feature: User Password Reset with Email OTP

Requirements:
- User clicks "Forgot Password" on login page
- System sends OTP to registered email
- OTP expires after 10 minutes
- User enters OTP and sets new password

Acceptance criteria:
- Email delivered within 30 seconds
- Invalid OTP shows clear error message
- Password must meet complexity rules (8+ chars, mixed case, number)

App URL: https://myapp.com
Tech stack: React frontend, Node.js REST API, PostgreSQL
```

---

### 2. `bug-prevention` — Bug Prevention & Root Cause Analysis

**When to use:** After a bug cluster or production incident.

**Agent sequence:**
```
bug-pattern-analyst → requirements-analyst → test-case-generator →
regression-optimizer → testware-creator
```

**Run:**
```bash
qa-agent workflow bug-prevention -i bug_reports.md
```

**Input template:**
```
Bug reports / incident summary:
- BUG-201: Checkout fails silently when cart has 50+ items (Critical, 2026-04-01)
- BUG-198: Payment timeout not handled — user sees blank page (High, 2026-03-28)
- BUG-195: Discount code applied twice on retry (Medium, 2026-03-25)

Affected module: Checkout flow
Linked requirements: PBI-123, PBI-124
Environment: Production, Chrome 124, Node 20
```

---

### 3. `playwright-gen` — Playwright Test Generation

**When to use:** Automating a web app from scratch or adding tests to a new section.

**Agent sequence (10 steps):**
```
playwright-test-generator → ui-test-designer → seed-data-manager →
api-coverage-planner → test-validator → inventory-builder →
coverage-hunter (parallel) → pr-hygiene-checker (parallel) →
accessibility-auditor (parallel) → performance-profiler (parallel)
```

**Run:**
```bash
qa-agent workflow playwright-gen -i "https://demoqa.com"
# or with a file:
qa-agent workflow playwright-gen -i playwright_task.md
```

**Input template:**
```
App URL: https://myapp.com
Pages to cover: Login, Dashboard, User Settings, Checkout
Auth: Email + password. Test user: test@example.com / Test1234
Priority flows: Login, Add to cart, Complete checkout
Playwright project path: playwright/
```

---

### 4. `flake-investigation` — Flaky Test Investigation

**When to use:** CI shows intermittent failures that don't reproduce reliably.

**Agent sequence:**
```
flake-triage → test-results-analyst → playwright-test-generator → pr-hygiene-checker
```

**Run:**
```bash
qa-agent workflow flake-investigation -i flaky_tests.md
```

**Input template:**
```
Flaky tests:
- playwright/tests/ui/checkout.spec.ts — "should complete order" fails ~30% of runs
- playwright/tests/ui/login.spec.ts — "should redirect after login" fails on slow CI

Recent CI results: 8/10 runs passed, 2 had random failures
Environment: GitHub Actions, Node 20, Playwright 1.59
```

---

### 5. `api-coverage` — Full API Test Coverage

**When to use:** Planning or auditing REST API test coverage.

**Agent sequence:**
```
api-coverage-planner → test-case-generator → playwright-test-generator →
coverage-hunter → pr-hygiene-checker
```

**Run:**
```bash
qa-agent workflow api-coverage -i api_spec.md
```

**Input template:**
```
API endpoints:
- POST /api/auth/login
- POST /api/auth/register
- GET  /api/users/:id
- PUT  /api/users/:id
- DELETE /api/users/:id
- GET  /api/products?page=&limit=
- POST /api/orders

Base URL: https://api.myapp.com
Auth: Bearer token
Existing API tests: playwright/tests/api/
Priority: Auth flows and user CRUD first
```

---

### 6. `security-audit` — Security Audit

**When to use:** Before a release or as a regular security hygiene check.

**Agent sequence:**
```
security-scout → coverage-hunter → testware-creator
```

**Run:**
```bash
qa-agent workflow security-audit -i security_task.md
```

**Input template:**
```
Scope: Full repository
Codebase path: .
Known risk areas: Auth tokens in fixture files, third-party script injection
Previous audit date: 2026-03-01
```

---

### 7. `test-debt` — Test Debt Assessment

**When to use:** CI is slow, tests are unreliable, or coverage is unknown.

**Agent sequence:**
```
coverage-hunter (parallel) → pr-hygiene-checker (parallel) →
flake-triage (parallel) → regression-optimizer → testware-creator
```

**Run:**
```bash
qa-agent workflow test-debt -i test_health.md
```

**Input template:**
```
Test directory: playwright/tests/
App URL: https://myapp.com
Recent CI failure rate: ~15% of runs have at least one failure
Known problem areas: Checkout flow, date picker interactions
Desired outcome: Prioritized action list + lean regression suite
```

---

### 8. `test-monitoring` — Continuous Test Health Monitoring

**When to use:** Regular check on test health trends and coverage.

**Agent sequence:**
```
coverage-hunter (parallel) → test-results-analyst (parallel) →
flake-triage → testware-creator
```

**Run:**
```bash
qa-agent workflow test-monitoring -i monitoring_task.md
```

**Input template:**
```
Test directory: playwright/tests/
Recent test results: playwright/test-results.json
Time window: Last 2 weeks
Focus: New flaky tests, coverage regressions
```

---

### 9. `ai-testing` — AI/ML Feature Testing

**When to use:** Testing features that use ML models, AI-generated content, or classifiers.

**Agent sequence:**
```
ai-test-architect → test-case-generator → synthetic-data-designer →
test-oracle-creator → testware-creator
```

**Run:**
```bash
qa-agent workflow ai-testing -i ai_feature.md
```

**Input template:**
```
Feature: Product recommendation engine
Model type: Collaborative filtering
Non-determinism: Results may vary by +/-5% — use similarity threshold
Bias risks: Must not discriminate by gender or age
Compliance: GDPR, EU AI Act — explainability required
Accuracy threshold: >= 90% precision on test set
```

---

### 10. `release-signoff` — Release Sign-off

**When to use:** Final QA gate before deploying to production.

**Agent sequence:**
```
regression-optimizer → test-results-analyst → testware-creator
```

**Run:**
```bash
qa-agent workflow release-signoff -i release_task.md
```

**Input template:**
```
Release version: v2.5.0
App URL (staging): https://staging.myapp.com
Scope of changes: New checkout flow, updated user profile
Requirements in scope: PBI-101, PBI-102, PBI-103
Coverage threshold: >= 80% of in-scope requirements must have passing tests
Regression suite path: playwright/tests/
Sign-off approvers: QA Lead, Product Owner
```

---

### 11. `contract-testing` — Consumer-Driven Contract Testing

**When to use:** Validating API contracts and backward compatibility.

**Agent sequence:**
```
api-coverage-planner → api-contract-validator → test-case-generator →
playwright-test-generator → testware-creator
```

**Run:**
```bash
qa-agent workflow contract-testing -i openapi_spec.yaml
```

**Input template:**
```
API spec: docs/openapi.yaml
Consumer services: frontend-app, mobile-app, partner-api
Breaking change policy: No breaking changes without 2-week deprecation
Base URL: https://api.myapp.com
```

---

### 12. `exploratory-testing` — Exploratory Testing

**When to use:** Explore a web app, discover pages, generate and execute tests, log bugs, and report.

**Agent sequence:**
```
exploratory-tester → playwright-recorder → playwright-executor →
bug-reporter → report-creator
```

**Run:**
```bash
qa-agent workflow exploratory-testing -i "https://demoqa.com"
```

**Input template:**
```
App URL: https://demoqa.com
Focus areas: All pages, forms, and interactive elements
Auth: test@example.com / Test1234
Risk areas: Form validation, navigation, data submission
Session budget: 1 hour
```

---

### 13. `playwright-copilot-flow` — Playwright Copilot Full Flow

**When to use:** Plan, generate, execute, log bugs, and report using Playwright Copilot agents.

**Agent sequence:**
```
playwright-copilot (plan) → playwright-copilot (generate) →
playwright-executor → bug-reporter → report-creator
```

**Run:**
```bash
qa-agent workflow playwright-copilot-flow -i "https://demoqa.com"
```

---

### 14. `full-qa-pipeline` — Full QA Pipeline

**When to use:** End-to-end: explore, generate, execute, analyze, log bugs, and produce formal reports.

**Agent sequence (7 steps):**
```
exploratory-tester → playwright-recorder → playwright-executor →
bug-reporter (parallel) → test-results-analyst (parallel) →
report-creator → testware-creator
```

**Run:**
```bash
qa-agent workflow full-qa-pipeline -i "https://staging.myapp.com"
```

**Input template:**
```
App URL: https://staging.myapp.com
Auth: test@example.com / Test1234
Scope: Full application — all user-facing pages and flows
Priority flows: Registration, Login, Search, Checkout
Report format: HTML + Markdown
```

---

### 15. `pbi-to-report` — PBI to Report Full Pipeline

**When to use:** You have a PBI/user story and want the complete journey: requirements analysis through test execution to final report.

**Agent sequence (7 steps):**
```
requirements-analyst → test-case-generator → playwright-test-generator →
playwright-executor → bug-reporter (parallel) → test-results-analyst (parallel) →
report-creator
```

**Run:**
```bash
qa-agent workflow pbi-to-report -i inputs/pbi-to-report.md
```

**Input template:**
```
PBI: As a registered user, I want to reset my password via email link
so that I can regain access to my account.

Acceptance criteria:
1. User receives a reset email within 30 seconds
2. Reset link expires after 24 hours
3. New password must be 8+ chars with uppercase, lowercase, and number

App URL: https://demoqa.com
Playwright project path: playwright/
Test credentials: test@example.com / Test1234
Priority flows: Happy path, invalid email, expired link
```

---

### 16. `post-deploy-smoke` — Post-Deployment Smoke & Canary

**When to use:** Immediately after deploying — verify critical paths.

**Agent sequence:**
```
seed-data-manager → playwright-test-generator (parallel) →
api-contract-validator (parallel) → test-results-analyst → testware-creator
```

**Run:**
```bash
qa-agent workflow post-deploy-smoke -i smoke_task.md
```

**Input template:**
```
Environment: staging
App URL: https://staging.myapp.com
Deployed version: v2.5.0
Critical paths:
- Homepage loads successfully
- User can log in
- Search returns results
- Checkout completes
Maximum run time: 10 minutes
```

---

## Advanced Usage

### Dry Run (preview execution plan)

```bash
qa-agent workflow feature-testing -i requirements.md --dry-run
```

Shows the DAG execution plan with agent sequence and dependencies without running anything.

### Skip Agents

```bash
qa-agent workflow playwright-gen -i "https://myapp.com" --skip accessibility-auditor performance-profiler
```

Removes specified agents and updates dependency graph automatically.

### Resume from Checkpoint

If a workflow fails mid-execution, it saves a checkpoint. Resume where it left off:

```bash
# List available checkpoints
qa-agent list-checkpoints

# Resume
qa-agent workflow pbi-to-report -i requirements.md --resume outputs/checkpoints/<session-id>.json
```

### Model Override

Use a specific model profile for all agents in the workflow:

```bash
# Fast, cost-efficient (recommended for iteration)
qa-agent workflow feature-testing -i requirements.md -m copilot-claude-haiku

# Higher quality (for final runs)
qa-agent workflow feature-testing -i requirements.md -m copilot-gpt4o

# Direct Anthropic API
qa-agent workflow pbi-to-report -i pbi.md -m claude-sonnet-api

# Local model (no API key needed)
qa-agent workflow security-audit -i scope.md -m ollama-llama3
```

### Webhook Notifications

Get notified on Slack (or any webhook) when a workflow completes:

```bash
qa-agent workflow full-qa-pipeline -i "https://myapp.com" --notify https://hooks.slack.com/services/T.../B.../xxx
```

### Custom Workflow Files

Create your own workflow YAML and run it:

```yaml
# my-workflow.yaml
name: "My Custom Workflow"
description: "Custom agent sequence for my project"
steps:
  - index: 1
    agent: requirements-analyst
    description: "Analyze requirements"
    dependencies: []
  - index: 2
    agent: test-case-generator
    description: "Generate test cases"
    dependencies: [1]
  - index: 3
    agent: playwright-test-generator
    description: "Create automated tests"
    dependencies: [2]
```

```bash
qa-agent orchestrate --workflow-file my-workflow.yaml -i requirements.md
```

### Reorder Agents and Override Dependencies

```bash
# Reorder agents within a workflow
qa-agent orchestrate -w feature-testing -i req.md \
  --reorder "1:test-case-generator, 2:requirements-analyst, 3:testware-creator"

# Override dependencies
qa-agent orchestrate -w feature-testing -i req.md \
  --deps "3:[1,2], 4:[3]"
```

### Verbose Mode and Logging

```bash
# See full prompts and responses
qa-agent --verbose workflow pbi-to-report -i pbi.md

# Write structured JSON log
qa-agent --log-file run.log workflow pbi-to-report -i pbi.md
```

### Chain Agents (linear sequence, no DAG)

For simple linear sequences without the workflow engine:

```bash
qa-agent chain requirements-analyst test-case-generator testware-creator -i requirements.md
```

---

## Workflow Quick Reference

| Key | Name | Steps | Best Input |
|-----|------|-------|------------|
| `feature-testing` | New Feature Testing | 5 | PBI / user story |
| `bug-prevention` | Bug Prevention & Root Cause | 5 | Bug reports / incident summary |
| `playwright-gen` | Playwright Test Generation | 10 | App URL |
| `flake-investigation` | Flaky Test Investigation | 4 | Flaky test files + CI logs |
| `api-coverage` | Full API Test Coverage | 5 | OpenAPI spec / endpoint list |
| `security-audit` | Security Audit | 3 | Codebase path / scope |
| `test-debt` | Test Debt Assessment | 5 | Test directory + CI data |
| `test-monitoring` | Test Health Monitoring | 4 | Test directory + results |
| `ai-testing` | AI/ML Feature Testing | 5 | AI feature requirements |
| `release-signoff` | Release Sign-off | 3 | Release version + scope |
| `contract-testing` | Contract Testing | 5 | OpenAPI spec |
| `exploratory-testing` | Exploratory Testing | 5 | App URL |
| `playwright-copilot-flow` | Playwright Copilot Flow | 5 | App URL |
| `full-qa-pipeline` | Full QA Pipeline | 7 | App URL |
| `pbi-to-report` | PBI to Report Pipeline | 7 | PBI + App URL |
| `post-deploy-smoke` | Post-Deploy Smoke | 5 | App URL + version |

---

## Troubleshooting

### "Unknown workflow" error
Run `qa-agent list-workflows` to see available keys. Keys are case-sensitive and use hyphens.

### Workflow fails mid-execution
A checkpoint is saved automatically. Use `qa-agent list-checkpoints` to find it, then `--resume` to continue.

### Agent produces empty output
The workflow engine marks empty-output steps as failed and skips dependent steps. Check your API key and model configuration with `qa-agent doctor`.

### Need a different agent order
Use `--skip` to remove agents, or `orchestrate` with `--reorder` and `--deps` for full control.

### Running without API keys (dry run)
```bash
qa-agent workflow feature-testing -i requirements.md --dry-run
```
This shows the execution plan without calling any AI provider.
