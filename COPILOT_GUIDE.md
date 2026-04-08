# GitHub Copilot Setup & Usage Guide

A step-by-step reference for QA Engineers who want to run the QA Agent Ecosystem using **GitHub Copilot** as the AI provider.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Authenticate with GitHub](#3-authenticate-with-github)
4. [Verify Copilot Access](#4-verify-copilot-access)
5. [Configure Copilot as Your Default Provider](#5-configure-copilot-as-your-default-provider)
6. [Choosing the Right Copilot Model](#6-choosing-the-right-copilot-model)
7. [Running a Single Agent](#7-running-a-single-agent)
8. [Running the Orchestrator](#8-running-the-orchestrator)
9. [Human-in-the-Loop Interactions](#9-human-in-the-loop-interactions)
10. [DAG Workflow Engine (New in v2.0)](#10-dag-workflow-engine-new-in-v20)
11. [All 20 Workflows — Quick Reference](#11-all-20-workflows--quick-reference)
    - [Workflow 1 — New Feature Testing](#workflow-1--new-feature-testing)
    - [Workflow 2 — Bug Prevention and Root Cause](#workflow-2--bug-prevention-and-root-cause)
    - [Workflow 3 — Sprint / Release Regression](#workflow-3--sprint--release-regression)
    - [Workflow 4 — Playwright Test Generation](#workflow-4--playwright-test-generation)
    - [Workflow 5 — Flaky Test Investigation](#workflow-5--flaky-test-investigation)
    - [Workflow 6 — UI Mockup vs Implementation Comparison](#workflow-6--ui-mockup-vs-implementation-comparison)
    - [Workflow 7 — Full API Test Coverage](#workflow-7--full-api-test-coverage)
    - [Workflow 8 — Security Audit](#workflow-8--security-audit)
    - [Workflow 9 — Test Data & Fixture Bootstrap](#workflow-9--test-data--fixture-bootstrap)
    - [Workflow 10 — Full Test Health Audit](#workflow-10--full-test-health-audit)
    - [Workflow 11 — Cross-Browser Compatibility Testing](#workflow-11--cross-browser-compatibility-testing)
    - [Workflow 12 — Responsive & Mobile Testing](#workflow-12--responsive--mobile-testing)
    - [Workflow 13 — AI/ML Feature Testing](#workflow-13--aiml-feature-testing)
    - [Workflow 14 — Release Sign-off / Go-Live Checklist](#workflow-14--release-sign-off--go-live-checklist)
    - [Workflow 15 — End-to-End User Journey Mapping & Automation](#workflow-15--end-to-end-user-journey-mapping--automation)
    - [Workflow 16 — Test Data Cleanup & Maintenance](#workflow-16--test-data-cleanup--maintenance)
    - [Workflow 17 — Exploratory Testing Session Planner](#workflow-17--exploratory-testing-session-planner)
    - [Workflow 18 — PR / Code Review QA Gate](#workflow-18--pr--code-review-qa-gate)
    - [Workflow 19 — Post-Deployment Smoke Verification](#workflow-19--post-deployment-smoke-verification)
    - [Workflow 20 — Requirements Traceability Audit](#workflow-20--requirements-traceability-audit)
12. [Playwright Workflows with Copilot](#12-playwright-workflows-with-copilot)
13. [Saving and Reviewing Outputs](#13-saving-and-reviewing-outputs)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

Before you start, make sure you have the following:

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | Required for Playwright (`node --version`) |
| GitHub CLI (`gh`) | Latest | Used for Copilot authentication |
| GitHub Copilot subscription | Individual or Business | Copilot Chat must be enabled on your account |

**Install the GitHub CLI** if you do not have it:

```bash
# Windows (winget)
winget install GitHub.cli

# macOS (Homebrew)
brew install gh

# Linux (apt)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) \
  signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
  https://cli.github.com/packages stable main" \
  | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh
```

---

## 2. Installation

```bash
# Clone the repository
git clone https://github.com/paveltspavlov/QA-Agent-Ecosystem.git
cd QA-Agent-Ecosystem

# Create and activate a virtual environment
python -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows CMD
.venv\Scripts\activate

# Windows PowerShell
.venv\Scripts\Activate.ps1

# Install base dependencies
pip install setuptools
pip install -e .

# Install the Copilot SDK extras (required for the copilot provider)
pip install -e ".[copilot]"

# (Optional) Install Playwright for browser automation workflows
cd playwright && npm install && npx playwright install --with-deps && cd ..
```

> You do **not** need an `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` when using GitHub Copilot.

---

## 3. Authenticate with GitHub

The Copilot provider uses your GitHub account — no separate API key is required.

```bash
gh auth login
```

Follow the interactive prompts:
1. Select **GitHub.com**
2. Select **HTTPS** as the preferred protocol
3. Authenticate via browser (recommended) or paste a personal access token
4. Confirm the authentication scope includes `copilot`

**Verify the login succeeded:**

```bash
gh auth status
```

Expected output:
```
github.com
  ✓ Logged in to github.com as <your-username> (...)
  ✓ Git operations for github.com configured to use https protocol.
  ✓ Token: gho_...
```

---

## 4. Verify Copilot Access

Confirm that your account has Copilot enabled:

```bash
gh copilot --help
```

If the command is not found, install the Copilot CLI extension:

```bash
gh extension install github/gh-copilot
```

You can also run a quick connectivity test using the CLI:

```bash
qa-agent list-agents
```

If the command completes without errors, the environment is ready.

---

## 5. Configure Copilot as Your Default Provider

Open `qa_ecosystem/models.yaml` and update the `roles` section so that all agents default to a Copilot profile:

```yaml
roles:
  default: copilot-gpt4o           # all planning agents
  orchestrator: copilot-gpt4o      # test-manager orchestrator
  playwright: copilot-gpt4o        # Playwright execution agents
  analysis: copilot-o3-mini        # analysis agents
```

> **Tip:** For complex reasoning tasks, set `orchestrator: copilot-o3-mini` in the `roles` section of `models.yaml`.

Save the file. No restart or environment variable is needed — the configuration is read at runtime.

---

## 6. Choosing the Right Copilot Model

Four Copilot model profiles are available. Choose based on the task:

| Profile | Model | Best For |
|---------|-------|----------|
| `copilot-gpt4o` | GPT-4o | General orchestration, test case generation, fast responses |
| `copilot-o3-mini` | o3-mini | Deep analysis, requirements review, traceability audits, logical coverage checks |
| `copilot-gemini` | Gemini 2.5 Pro | Multimodal tasks — mockup comparison, UI analysis with images |
| `copilot-claude-haiku` | Claude Haiku 4.5 | Fast, lightweight tasks — simple test generation, quick summaries |

**Recommended model per workflow category:**

| Workflow category | Recommended model |
|-------------------|-------------------|
| New feature testing, regression | `copilot-gpt4o` |
| Requirements analysis, AI/ML testing | `copilot-o3-mini` |
| Traceability, release sign-off | `copilot-o3-mini` |
| UI mockup comparison (Workflow 6, 12) | `copilot-gemini` |
| Playwright generation and execution | `copilot-gpt4o` |

Override the model for a single run without editing the config file:

```bash
qa-agent run requirements-analyst -i story.md -m copilot-o3-mini
qa-agent orchestrate -i release_task.md -m copilot-o3-mini
```

---

## 7. Running a Single Agent

```bash
# Basic run — uses the model from models.yaml
qa-agent run <agent-name> -i <input-file-or-text>

# With a specific Copilot model
qa-agent run <agent-name> -i <input> -m copilot-gpt4o

# With a specific prompt template
qa-agent run <agent-name> -i <input> -t <template-name> -m copilot-gpt4o
```

**Common single-agent examples:**

```bash
# Analyse a user story for ambiguities
qa-agent run requirements-analyst -i "As a user I want to reset my password via email OTP" -m copilot-o3-mini

# Generate ISTQB test cases from a PBI file
qa-agent run test-case-generator -i examples/sample_pbi.md -m copilot-gpt4o

# Analyse a set of bug reports for patterns
qa-agent run bug-pattern-analyst -i bugs/sprint-14-bugs.md -m copilot-gpt4o

# Design an optimised regression suite
qa-agent run regression-optimizer -i sprint_context.md -m copilot-gpt4o

# Generate Playwright tests from a requirements file
qa-agent run playwright-test-generator -i requirements.md -m copilot-gpt4o

# Check test code quality
qa-agent run pr-hygiene-checker -i playwright/tests/ -m copilot-gpt4o

# Scan for secrets and security issues
qa-agent run security-scout -i . -m copilot-o3-mini
```

**List all 18 available agents:**

```bash
qa-agent list-agents
```

**List all prompt templates for an agent:**

```bash
qa-agent list-templates --agent test-case-generator
```

---

## 8. Running the Orchestrator

The **Test Manager** is the orchestrator. It reads your task description, selects the appropriate workflow, and delegates to specialist agents in sequence (or in parallel where tasks are independent).

```bash
# Run the orchestrator with a task file
qa-agent orchestrate -i <task-file.md> -m copilot-gpt4o

# Run a specific workflow by including the workflow name in the input file
qa-agent orchestrate -i workflow1_task.md -m copilot-gpt4o
```

**What happens when you run the orchestrator:**

1. The Test Manager reads your input and analyzes the testing objective.
2. It builds an execution plan (ordered list of agents and their tasks).
3. **Plan approval:** The plan is presented for your review. You can:
   - **Approve** (`y` / Enter) — start execution immediately
   - **Edit inline** — type changes like "remove step 3" or "add security-scout after step 5"
   - **Edit as file** (`edit`) — open the plan as a markdown file for larger modifications
   - **Reject** (`n`) — cancel the plan entirely
4. Once approved, agents run in the approved order.
5. If `request_human_input` is in the workflow, the orchestrator **pauses and waits for you** (see section 9).
6. Each agent's output is saved to `outputs/<agent-name>/` automatically.
7. The Test Manager collects all results and compiles a final report.

**Example — Requirements-to-Report workflow:**

An end-to-end example that goes from raw requirements through test execution to a bug report:

```bash
qa-agent orchestrate -i examples/workflow_requirements_to_report.md -m copilot-gpt4o
```

This workflow runs: `requirements-analyst` -> user clarification -> `test-case-generator` ->
`playwright-test-generator` (generates and runs tests live) -> `test-results-analyst` ->
`bug-pattern-analyst` (consolidated bug report). See `examples/workflow_requirements_to_report.md`
for the full description.

**Delegation plan output:**

After each orchestration session, the Test Manager's delegation plan is appended to:

```
outputs/manager_instructions.md
```

This file records exactly which agents were invoked, in which order, and with what instructions.

---

## 9. Human-in-the-Loop Interactions

Several workflows include a `request_human_input` step. This is a designed pause point where the orchestrator presents findings from the `requirements-analyst` and waits for you to provide updated or clarified requirements before continuing.

**What it looks like in the terminal:**

```
[Test Manager] The Requirements Analyst has identified the following ambiguities:

  1. The acceptance criteria do not specify what happens when the OTP expires.
  2. It is unclear whether the password reset link should work once or multiple times.
  3. No requirement covers locked accounts attempting a reset.

Please provide updated or clarified requirements, then press Enter to continue.
> _
```

**How to respond:**

- Type your clarifications or updated requirements and press **Enter**.
- Press **Enter** with no text to skip and let the orchestrator continue with the original requirements.

**Workflows that include a human-in-the-loop pause:**

| Workflow | Pause point |
|----------|-------------|
| Workflow 1 — New Feature Testing | After requirements-analyst |
| Workflow 6 — UI Mockup vs Implementation | After requirements-analyst |
| Workflow 13 — AI/ML Feature Testing | After requirements-analyst |

### Tool Permission Approval

When using a Copilot model, every tool action (shell commands, file writes, URL fetches, file reads) prompts you for approval before it runs:

```
Permission requested: shell
  Command : ls -la
  Approve? [Y/n/a(ll)]: _
```

**How to respond:**

| Input | Effect |
|-------|--------|
| Enter / `y` / `yes` | Approve this single action |
| `a` / `all` | Approve this action **and all remaining actions** in the session |
| `n` / `no` (or any other text) | Deny this action |

Once you choose **approve all**, subsequent actions are auto-approved for the rest of that session. The approval mode resets at the start of every new `qa-agent run` or `qa-agent orchestrate` invocation.

---

## 10. DAG Workflow Engine (New in v2.0)

The ecosystem now includes a **DAG-based workflow engine** that executes agents in dependency order, with parallel execution for independent steps. 13 predefined workflows are available in `workflows.yaml`.

### Using Predefined Workflows

```bash
# List all available DAG workflows
qa-agent list-workflows

# Run a predefined workflow
qa-agent orchestrate -i requirements.md --workflow feature-testing

# Run from a custom workflow YAML file
qa-agent orchestrate -i requirements.md --workflow-file custom.yaml
```

### Customizing Workflows

You can reorder agents, override dependencies, and skip agents:

```bash
# Reorder agents (assign new indices)
qa-agent orchestrate -i requirements.md --workflow feature-testing \
  --reorder "1:test-case-generator, 2:requirements-analyst, 3:testware-creator"

# Override dependencies
qa-agent orchestrate -i requirements.md --workflow feature-testing \
  --deps "2:[1], 3:[1,2]"

# Skip specific agents
qa-agent orchestrate -i requirements.md --workflow feature-testing \
  --skip synthetic-data-designer test-oracle-creator

# Send a Slack notification on completion
qa-agent orchestrate -i requirements.md --workflow feature-testing \
  --notify https://hooks.slack.com/services/T00/B00/xxx
```

### Available DAG Workflows

| Workflow | Steps | Description |
|----------|-------|-------------|
| `feature-testing` | 5 | Requirements → test cases → data + oracles (parallel) → test plan |
| `bug-prevention` | 5 | Bug analysis → spec gaps → new tests → regression → report |
| `playwright-gen` | 5 | Explore site → POM classes + fixtures (parallel) → coverage → quality gate |
| `flake-investigation` | 4 | Diagnose flakes → trend analysis → rewrite tests → validate |
| `api-coverage` | 5 | Coverage matrix → test cases → API tests → verify → quality gate |
| `security-audit` | 3 | Scan vulnerabilities → coverage gaps → security report |
| `test-debt` | 5 | Coverage gaps + quality + flakes (parallel) → optimize → backlog |
| `test-monitoring` | 4 | Coverage + results (parallel) → flaky tests → dashboard |
| `ai-testing` | 5 | AI strategy → test cases + synthetic data (parallel) → validation → plan |
| `release-signoff` | 3 | Regression selection → results analysis → sign-off report |
| `contract-testing` | 5 | API inventory → validate contracts → test cases → implement → report |
| `post-deploy-smoke` | 5 | Seed data → smoke tests + API health (parallel) → analysis → report |

### Checkpoint Management

```bash
# List all saved checkpoints
qa-agent list-checkpoints

# Clean old checkpoints (keep most recent N)
qa-agent clean-checkpoints --keep 10
```

---

## 11. All 20 Workflows — Quick Reference

Each workflow below includes the agent chain, the CLI command, and a ready-to-use prompt template. Copy the template into a `.md` file, fill in the placeholders, and pass it to `qa-agent orchestrate`.

---

### Workflow 1 — New Feature Testing

**When to use:** Starting QA for a brand-new feature from a PBI or user story.

**Agent chain:**
```
requirements-analyst
  -> [PAUSE: present ambiguities, wait for updated requirements]
  -> test-case-generator
  -> synthetic-data-designer + test-oracle-creator  (parallel)
  -> testware-creator (Test Plan)
  -> test-results-analyst
  -> testware-creator (Test Report)
```

**Command:**
```bash
qa-agent orchestrate -i workflow1_task.md -m copilot-gpt4o
```

**Template — `workflow1_task.md`:**
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

### Workflow 2 — Bug Prevention and Root Cause

**When to use:** After a bug cluster or production incident — find the root cause and close the coverage gap.

**Agent chain:**
```
bug-pattern-analyst
  -> requirements-analyst  (spec gaps?)
  -> test-case-generator   (new validations)
  -> regression-optimizer
  -> testware-creator (Defect Report)
```

**Command:**
```bash
qa-agent orchestrate -i workflow2_task.md -m copilot-gpt4o
```

**Template — `workflow2_task.md`:**
```
Run Workflow 2 — Bug Prevention and Root Cause.

Bug reports / incident summary:
- [Bug 1: short description, date, severity]
- [Bug 2: ...]

Affected module: [e.g., "Checkout flow"]
Linked requirements: [PBI-123, PBI-124]
```

---

### Workflow 3 — Sprint / Release Regression

**When to use:** End of sprint or before a release — build an optimised regression suite.

**Agent chain:**
```
regression-optimizer
  -> synthetic-data-designer
  -> test-oracle-creator  (revalidation criteria)
  -> ai-test-architect    (if AI features are involved)
  -> testware-creator (Test Summary Report)
```

**Command:**
```bash
qa-agent orchestrate -i workflow3_task.md -m copilot-gpt4o
```

**Template — `workflow3_task.md`:**
```
Run Workflow 3 — Sprint Regression.

Sprint: [Sprint number / release name]
Changed modules: [e.g., "Payments, User Profile, Notifications"]
Existing test suite path: playwright/tests/
Risk areas: [e.g., "Payment gateway integration, session expiry"]
Contains AI features: [yes/no — if yes, describe the AI component]
```

---

### Workflow 4 — Playwright Test Generation

**When to use:** Automating a web app from scratch or adding automation to a new section.

**Agent chain:**
```
playwright-test-generator  (explore site, discover pages and user journeys)
  -> ui-test-designer       (create Page Object Model classes)
  -> seed-data-manager      (set up fixtures and data factories)
  -> coverage-hunter        (verify coverage against requirements)
  -> pr-hygiene-checker     (quality gate before commit)
```

**Command:**
```bash
qa-agent orchestrate -i workflow4_task.md -m copilot-gpt4o
# or use the shortcut:
qa-agent playwright-gen --url https://myapp.com -m copilot-gpt4o
```

**Template — `workflow4_task.md`:**
```
Run Workflow 4 — Playwright Test Generation.

App URL: https://myapp.com
Pages to cover: [e.g., "Login, Dashboard, User Settings, Checkout"]
Auth: [e.g., "Email + password. Test user: test@example.com / Test1234"]
Priority flows: [e.g., "Login, Add to cart, Complete checkout"]
Playwright project path: playwright/
```

---

### Workflow 5 — Flaky Test Investigation

**When to use:** CI is showing intermittent test failures that do not reproduce reliably.

**Agent chain:**
```
flake-triage              (diagnose root causes — race conditions, timing, external deps)
  -> test-results-analyst (trend analysis across recent runs)
  -> playwright-test-generator (rewrite flaky tests with proper waiting strategies)
  -> pr-hygiene-checker   (validate the fix before merge)
```

**Command:**
```bash
qa-agent orchestrate -i workflow5_task.md -m copilot-gpt4o
# or target specific files directly:
qa-agent playwright-analyze --agent flake-triage -i playwright/tests/
```

**Template — `workflow5_task.md`:**
```
Run Workflow 5 — Flaky Test Investigation.

Flaky tests (file paths or test names):
- playwright/tests/ui/checkout.spec.ts — "should complete order" fails ~30% of runs
- playwright/tests/ui/login.spec.ts — "should redirect after login" fails on slow CI

Recent CI run results: [paste JSON output or describe failure pattern]
Environment: [CI provider, Node version, Playwright version]
```

---

### Workflow 6 — UI Mockup vs Implementation Comparison

**When to use:** Validating that a developed feature matches its design mockup.

**Agent chain:**
```
requirements-analyst     (review requirements + mockup for ambiguities)
  -> [PAUSE: present questions, wait for updated requirements]
  -> playwright-test-generator (navigate live app, take screenshots of relevant pages)
  -> ui-test-designer    (compare screenshots against mockup, list deviations with severity)
  -> testware-creator    (format each deviation as a structured Bug Report)
```

**Command:**
```bash
qa-agent orchestrate -i workflow6_task.md -m copilot-gemini
```

> Use `copilot-gemini` for this workflow — Gemini 2.5 Pro has multimodal capability and can interpret image files directly.

**Template — `workflow6_task.md`:**
```
Run Workflow 6 — UI Mockup vs Implementation Comparison.

App URL: https://myapp.com
Mockup file: designs/feature-login-v2.png
  (or Figma link: https://figma.com/file/...)
  (or PDF wireframe: designs/wireframes.pdf)

Pages / sections to compare:
- Login page (desktop 1280px and mobile 375px)
- Password reset modal
- Dashboard header

Requirements:
- [Requirement 1 relevant to this UI]
- [Acceptance criteria]

For each deviation found, create a bug report following QA best practices
(Bug ID, Title, Severity, Priority, Environment, Steps to Reproduce,
Expected per mockup, Actual in implementation, Suggested Fix).
Save all bug reports to outputs/bugs/.
```

**Example bug report output** (`outputs/testware-creator/`):

```markdown
**Bug ID:** BUG-001
**Title:** "Sign in" button uses wrong background colour on mobile
**Severity:** Medium  |  **Priority:** P3
**Environment:** Chrome 120, Windows 11, https://myapp.com, 375×812
**Mockup Reference:** designs/feature-login-v2.png — mobile login section

**Steps to Reproduce:**
1. Open https://myapp.com/login at 375px viewport
2. Observe the "Sign in" button colour

**Expected (per mockup):** #1A73E8 (brand blue)
**Actual (implemented):** #4285F4 (incorrect shade)
**Suggested Fix:** Use `var(--color-primary)` in the button CSS class.
```

---

### Workflow 7 — Full API Test Coverage

**When to use:** Planning or auditing REST API test coverage for a service.

**Agent chain:**
```
requirements-analyst    (validate API requirements and spec completeness)
  -> api-coverage-planner  (build coverage matrix: method × endpoint × auth × status codes)
  -> playwright-test-generator (generate APIRequestContext test skeletons)
  -> coverage-hunter    (verify all endpoints and edge cases are covered)
  -> pr-hygiene-checker (quality gate on generated test code)
  -> testware-creator   (API Coverage Report)
```

**Command:**
```bash
qa-agent orchestrate -i workflow7_task.md -m copilot-gpt4o
# or target the route directory directly:
qa-agent playwright-analyze --agent api-coverage-planner -i src/routes/
```

**Template — `workflow7_task.md`:**
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

### Workflow 8 — Security Audit

**When to use:** Before a release, after adding new dependencies, or as a regular security hygiene check.

**Agent chain:**
```
security-scout    (scan for secrets, unsafe patterns, dangerous constructs)
  -> coverage-hunter (check whether security test scenarios exist for risk areas)
  -> testware-creator (Security Audit Report: findings by severity, remediation roadmap)
```

**Command:**
```bash
qa-agent orchestrate -i workflow8_task.md -m copilot-o3-mini
# or target a specific directory:
qa-agent playwright-analyze --agent security-scout -i playwright/
```

**Template — `workflow8_task.md`:**
```
Run Workflow 8 — Security Audit.

Scope: [e.g., "Full repository" or "playwright/ directory only"]
Codebase path: .
Known risk areas: [e.g., "Auth tokens in fixture files, third-party script injection"]
Previous audit date: [date or "never"]
```

---

### Workflow 9 — Test Data & Fixture Bootstrap

**When to use:** Starting a new feature that requires realistic test data, or when test data is brittle and causing failures.

**Agent chain:**
```
requirements-analyst    (extract data entities and edge-case values from PBIs)
  -> synthetic-data-designer (design privacy-safe datasets for boundary / negative cases)
  -> seed-data-manager  (implement fixtures, factories, seeding scripts, teardown helpers)
  -> coverage-hunter    (verify data scenarios cover all acceptance criteria)
  -> testware-creator   (Data Setup Documentation: factory catalogue, seeding instructions)
```

**Command:**
```bash
qa-agent orchestrate -i workflow9_task.md -m copilot-gpt4o
```

**Template — `workflow9_task.md`:**
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

### Workflow 10 — Full Test Health Audit

**When to use:** When CI is slow, tests are unreliable, or coverage is unknown — get a full health picture and a prioritised improvement plan.

**Agent chain:**
```
flake-triage          (diagnose unstable tests)
  -> coverage-hunter  (map coverage gaps across pages, endpoints, and user journeys)
  -> regression-optimizer (recommend a lean, risk-prioritised regression suite)
  -> pr-hygiene-checker   (quality gate on the full test codebase)
  -> testware-creator (Test Health Report: flaky inventory, gap map, suite recommendation)
```

**Command:**
```bash
qa-agent orchestrate -i workflow10_task.md -m copilot-gpt4o
```

**Template — `workflow10_task.md`:**
```
Run Workflow 10 — Full Test Health Audit.

Test directory: playwright/tests/
App URL: https://myapp.com
Recent CI failure rate: [e.g., "~15% of runs have at least one failure"]
Known problem areas: [e.g., "Checkout flow, anything touching date pickers"]
Desired outcome: prioritised action list + lean regression suite recommendation
```

---

### Workflow 11 — Cross-Browser Compatibility Testing

**When to use:** Verifying that features work correctly across Chromium, Firefox, and WebKit before a release.

**Agent chain:**
```
ui-test-designer          (configure multi-browser matrix)
  -> playwright-test-generator (generate or adapt tests for all browser projects)
  -> coverage-hunter        (verify all key user paths run in every browser)
  -> testware-creator       (Cross-Browser Compatibility Report)
```

**Command:**
```bash
qa-agent orchestrate -i workflow11_task.md -m copilot-gpt4o
```

**Template — `workflow11_task.md`:**
```
Run Workflow 11 — Cross-Browser Compatibility Testing.

App URL: https://myapp.com
Features to verify: [e.g., "Login, Dashboard, Checkout, File Upload"]
Existing test path: playwright/tests/
Browsers: chromium, firefox, webkit
Known browser-specific issues: [e.g., "File input behaves differently on webkit"]
```

---

### Workflow 12 — Responsive & Mobile Testing

**When to use:** Verifying layout and interactions at multiple viewport sizes before shipping a UI change.

**Agent chain:**
```
ui-test-designer          (configure viewport sizes: 375px, 768px, 1280px)
  -> playwright-test-generator (generate viewport-specific scenarios and screenshot comparisons)
  -> coverage-hunter        (verify all pages tested at every breakpoint)
  -> testware-creator       (Responsive Testing Report: per-viewport screenshots, layout issues)
```

**Command:**
```bash
qa-agent orchestrate -i workflow12_task.md -m copilot-gemini
```

**Template — `workflow12_task.md`:**
```
Run Workflow 12 — Responsive & Mobile Testing.

App URL: https://myapp.com
Pages to test: [e.g., "Landing page, Product listing, Cart, Checkout"]
Viewports: 375x812 (mobile), 768x1024 (tablet), 1280x800 (desktop)
Design breakpoints defined at: [e.g., "375px, 768px, 1280px"]
Known responsive issues: [e.g., "Navigation collapses incorrectly on tablet"]
```

---

### Workflow 13 — AI/ML Feature Testing

**When to use:** Testing features that use machine learning models, AI-generated content, recommendations, or classification systems.

**Agent chain:**
```
requirements-analyst     (identify non-determinism risks, bias scenarios, compliance requirements)
  -> [PAUSE: clarify acceptable thresholds and compliance constraints]
  -> ai-test-architect   (design strategy: bias checks, drift detection, adversarial inputs)
  -> test-case-generator (generate AI-specific test cases including edge cases)
  -> synthetic-data-designer (create adversarial, boundary, and bias-probe datasets)
  -> testware-creator    (AI Test Strategy Document with compliance checklist)
```

**Command:**
```bash
qa-agent orchestrate -i workflow13_task.md -m copilot-o3-mini
```

**Template — `workflow13_task.md`:**
```
Run Workflow 13 — AI/ML Feature Testing.

Feature: [e.g., "Product recommendation engine" or "Sentiment classifier"]
Model type: [e.g., "Collaborative filtering", "LLM-based", "Binary classifier"]
Non-determinism handling: [e.g., "Results may vary ±5% — use similarity threshold"]
Bias risks: [e.g., "Must not discriminate by gender or age in recommendations"]
Compliance: [e.g., "GDPR, EU AI Act — explainability required"]
Acceptable accuracy threshold: [e.g., "≥ 90% precision on test set"]
```

---

### Workflow 14 — Release Sign-off / Go-Live Checklist

**When to use:** Final QA gate before deploying to production.

**Agent chain:**
```
requirements-analyst  (verify all in-scope requirements have test coverage)
  -> regression-optimizer   (run risk-prioritised regression subset)
  -> security-scout         (final scan: secrets, unsafe patterns, staging URLs)
  -> coverage-hunter        (confirm coverage meets release threshold)
  -> pr-hygiene-checker     (final quality gate on the test suite)
  -> testware-creator       (Release Sign-off Report: gate results, pass/fail verdict)
```

**Command:**
```bash
qa-agent orchestrate -i workflow14_task.md -m copilot-o3-mini
```

> `copilot-o3-mini` is recommended here for its strong multi-step logical reasoning — it will systematically verify every gate condition before issuing a verdict.

**Template — `workflow14_task.md`:**
```
Run Workflow 14 — Release Sign-off / Go-Live Checklist.

Release version: v[X.Y.Z]
App URL (staging): https://staging.myapp.com
Scope of changes: [e.g., "New checkout flow, updated user profile, payment gateway upgrade"]
Requirements in scope: [PBI-101, PBI-102, PBI-103]
Coverage threshold: [e.g., "≥ 80% of in-scope requirements must have passing tests"]
Regression suite path: playwright/tests/
Sign-off approvers: [e.g., "QA Lead, Product Owner"]
```

---

### Workflow 15 — End-to-End User Journey Mapping & Automation

**When to use:** Automating full business flows from a user's perspective.

**Agent chain:**
```
requirements-analyst          (extract user journeys and acceptance criteria from personas)
  -> playwright-test-generator (explore app, map actual navigation flows)
  -> ui-test-designer          (implement E2E journey tests with full POM coverage per persona)
  -> seed-data-manager         (set up journey-specific test data and teardown helpers)
  -> coverage-hunter           (verify every journey step is covered)
  -> testware-creator          (User Journey Test Catalogue with persona-flow-test mapping)
```

**Command:**
```bash
qa-agent orchestrate -i workflow15_task.md -m copilot-gpt4o
```

**Template — `workflow15_task.md`:**
```
Run Workflow 15 — End-to-End User Journey Mapping & Automation.

App URL: https://myapp.com
User personas:
  - Guest: browses products, adds to cart, checks out as guest
  - Registered user: logs in, purchases, views order history
  - Admin: manages products, views sales reports

Key business flows to automate:
  1. Guest checkout (browse -> cart -> payment -> confirmation)
  2. Registered user repeat purchase
  3. Admin product catalogue management

Auth credentials: [test credentials per persona]
Playwright project path: playwright/
```

---

### Workflow 16 — Test Data Cleanup & Maintenance

**When to use:** When fixtures are stale, factories produce collisions, or test data no longer reflects the current data model.

**Agent chain:**
```
coverage-hunter         (audit fixtures: identify stale, duplicate, or incomplete datasets)
  -> seed-data-manager  (remove stale fixtures, consolidate duplicates, refresh values)
  -> synthetic-data-designer (redesign datasets that no longer cover current requirements)
  -> testware-creator   (Data Maintenance Report: what changed, updated factory catalogue)
```

**Command:**
```bash
qa-agent orchestrate -i workflow16_task.md -m copilot-gpt4o
```

**Template — `workflow16_task.md`:**
```
Run Workflow 16 — Test Data Cleanup & Maintenance.

Test data path: playwright/test-data/
Fixtures path: playwright/fixtures/
Known issues:
  - [e.g., "User factory produces duplicate emails causing test collisions"]
  - [e.g., "Order fixtures reference deleted product IDs"]
  - [e.g., "Auth fixtures expire after 7 days — need refresh"]
Current data model changes: [brief description of schema changes since last update]
```

---

### Workflow 17 — Exploratory Testing Session Planner

**When to use:** Preparing a structured exploratory testing effort for a new feature, release, or high-risk area.

**Agent chain:**
```
requirements-analyst   (identify ambiguous, high-risk, or poorly-specified areas)
  -> bug-pattern-analyst (review historical bugs to guide exploration priorities)
  -> test-oracle-creator (define expected behaviour and pass/fail criteria for explorers)
  -> testware-creator    (Exploratory Testing Charters: goals, time boxes, risk areas, heuristics)
```

**Command:**
```bash
qa-agent orchestrate -i workflow17_task.md -m copilot-o3-mini
```

**Template — `workflow17_task.md`:**
```
Run Workflow 17 — Exploratory Testing Session Planner.

Feature / area to explore: [e.g., "New payment flow with 3DS authentication"]
Release date: [date]
Session budget: [e.g., "3 testers × 2 hours each"]
Known risk areas: [e.g., "3DS redirect timing, declined card handling, currency edge cases"]
Historical bugs in this area: [describe or attach bug reports]
Tester experience level: [e.g., "1 senior, 2 mid-level"]
```

---

### Workflow 18 — PR / Code Review QA Gate

**When to use:** Before merging a PR that contains test code changes.

**Agent chain:**
```
pr-hygiene-checker  (8-check quality gate: selectors, waiting, structure, naming)
  -> security-scout  (scan changed files for secrets and unsafe patterns)
  -> coverage-hunter (coverage delta: new code paths without test coverage)
  -> flake-triage    (flake risk assessment of new or modified tests)
  -> testware-creator (PR QA Gate Report: pass/fail per check, actionable feedback)
```

**Command:**
```bash
qa-agent orchestrate -i workflow18_task.md -m copilot-gpt4o
# or target files directly:
qa-agent playwright-analyze --agent pr-hygiene-checker -i playwright/tests/
```

**Template — `workflow18_task.md`:**
```
Run Workflow 18 — PR / Code Review QA Gate.

PR branch: [branch name]
Changed test files:
  - playwright/tests/ui/checkout.spec.ts   (modified)
  - playwright/pages/checkout.page.ts      (new)
  - playwright/fixtures/order.fixture.ts   (new)
Changed source files: [optional — list if you want coverage delta analysis]
PR description: [paste PR title and summary]
```

---

### Workflow 19 — Post-Deployment Smoke Verification

**When to use:** Immediately after deploying to staging or production — verify critical paths before announcing the release.

**Agent chain:**
```
playwright-test-generator (identify or generate critical smoke tests for key paths)
  -> coverage-hunter       (verify smoke suite covers all critical entry points)
  -> testware-creator      (Smoke Verification Report: pass/fail per path, environment, issues)
```

**Command:**
```bash
qa-agent orchestrate -i workflow19_task.md -m copilot-gpt4o
# or run the smoke suite directly:
qa-agent playwright-run --project chromium --grep "@smoke" --analyze
```

**Template — `workflow19_task.md`:**
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

### Workflow 20 — Requirements Traceability Audit

**When to use:** Ensuring every requirement has at least one test case — before a sign-off or compliance audit.

**Agent chain:**
```
requirements-analyst  (catalogue all requirements, user stories, and acceptance criteria)
  -> coverage-hunter  (map existing tests to requirements, identify uncovered items)
  -> test-case-generator (generate missing test cases for uncovered requirements)
  -> testware-creator (Traceability Matrix: Requirement ID <-> Test Case IDs <-> Coverage %)
```

**Command:**
```bash
qa-agent orchestrate -i workflow20_task.md -m copilot-o3-mini
```

**Template — `workflow20_task.md`:**
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

## 12. Playwright Workflows with Copilot

The three dedicated Playwright CLI commands work with all Copilot models:

### Generate tests from a URL

```bash
qa-agent playwright-gen --url https://myapp.com -m copilot-gpt4o

# With a specific agent and template
qa-agent playwright-gen --url https://myapp.com --agent ui-test-designer -m copilot-gpt4o
```

### Run Playwright tests with optional AI analysis

```bash
# Run all Chromium tests and analyse results
qa-agent playwright-run --project chromium --analyze -m copilot-gpt4o

# Run API tests with JSON reporter
qa-agent playwright-run --project api --reporter json

# Run only smoke-tagged tests
qa-agent playwright-run --project chromium --grep "@smoke" --analyze
```

### Analyse existing test code

```bash
# Check test hygiene on the full test directory
qa-agent playwright-analyze --agent pr-hygiene-checker -i playwright/tests/ -m copilot-gpt4o

# Security scan the Playwright project
qa-agent playwright-analyze --agent security-scout -i playwright/ -m copilot-o3-mini

# Diagnose a specific flaky test file
qa-agent playwright-analyze --agent flake-triage -i playwright/tests/ui/login.spec.ts -m copilot-gpt4o

# Check API coverage against your route source
qa-agent playwright-analyze --agent api-coverage-planner -i src/routes/ -m copilot-gpt4o
```

### All 8 Playwright agent names

| Agent | Purpose |
|-------|---------|
| `playwright-test-generator` | Generate Playwright TypeScript tests |
| `ui-test-designer` | POM-based UI tests, accessibility selectors |
| `api-coverage-planner` | API test coverage matrix |
| `pr-hygiene-checker` | 8-check code quality gate |
| `security-scout` | Secrets and vulnerability scanning |
| `coverage-hunter` | Test coverage gap analysis |
| `flake-triage` | Flaky test diagnosis and fix |
| `seed-data-manager` | Test data factories and fixtures |

---

## 13. Saving and Reviewing Outputs

Every agent run automatically saves its output to the `outputs/` folder.

```
outputs/
├── manager_instructions.md       <- Test Manager delegation plans (appended per session)
├── test-manager/
│   └── 2026-03-24_09-00-00.md
├── requirements-analyst/
│   └── 2026-03-24_09-01-15.md
├── test-case-generator/
│   └── 2026-03-24_09-02-30.md
├── testware-creator/
│   └── 2026-03-24_09-05-00.md    <- Test Plan, Bug Reports, Reports
└── ...
```

- Files are named by timestamp (`YYYY-MM-DD_HH-MM-SS.md`) — runs never overwrite each other.
- The Test Manager's delegation plan is appended to `outputs/manager_instructions.md` with a session header after every orchestration run.
- Bug reports from Workflow 6 are saved under `outputs/testware-creator/` (one file per bug or one consolidated report).

---

## 14. Troubleshooting

### `gh auth status` shows "not logged in"

```bash
gh auth login
# Follow the prompts and select "Authorize GitHub CLI"
```

### `qa-agent` command not found

```bash
# Make sure your virtual environment is active
source .venv/bin/activate       # Linux/macOS
.venv\Scripts\Activate.ps1      # Windows PowerShell

# Reinstall the package
pip install -e ".[copilot]"
```

### `copilot provider is not available` error

```bash
# Ensure the copilot SDK extras are installed
pip install -e ".[copilot]"

# Confirm gh is authenticated
gh auth status
```

### Model routing fails or returns a generic response

- Confirm your GitHub Copilot subscription is active at [github.com/settings/copilot](https://github.com/settings/copilot).
- Ensure the `model_id` in `models.yaml` exactly matches one of: `gpt-4o`, `claude-sonnet-4.5`, `o3-mini`, `gemini-2.5-pro`.
- Try falling back to `copilot-gpt4o` — it is the most widely available Copilot model.

### The orchestrator pauses but I see no prompt

The human-in-the-loop prompt appears in the terminal where you ran the `qa-agent orchestrate` command. Ensure you are watching the correct terminal window and that output buffering is not suppressing it (do not redirect stdout to a file when you need to interact).

### Playwright setup issues

```bash
# Re-install Playwright browsers
cd playwright
npx playwright install --with-deps

# Verify the installation
npx playwright --version
```

### Output files are not being created

The `outputs/` directory is created automatically on the first run. If it is missing after a run, check that the process completed without a Python exception and that the working directory is the repository root.

---

*For issues and feature requests, open a ticket at [github.com/paveltspavlov/QA-Agent-Ecosystem/issues](https://github.com/paveltspavlov/QA-Agent-Ecosystem/issues).*
