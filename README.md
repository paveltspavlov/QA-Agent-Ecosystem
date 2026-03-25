# QA Agent Ecosystem v2.0

18 AI-powered QA agents (10 planning + 8 Playwright execution) with multi-provider model support, orchestrated by a Test Manager. Built on the GitHub Copilot SDK (Agent mode) as the primary provider, with backward compatibility for direct Anthropic API access, Claude Agent SDK, OpenAI, and local models.

You can run agents individually or let the Test Manager orchestrator decompose a complex testing task, delegate to specialists in parallel, and consolidate the results.

---

## What's New in v2.0

- **20 orchestration workflows** -- covering new feature testing, bug analysis, regression, Playwright automation, mockup comparison, API coverage, security audit, cross-browser, responsive, AI/ML, release sign-off, user journey mapping, data maintenance, exploratory testing, PR gate, smoke verification, traceability audit, and more.
- **Human-in-the-loop pause** -- the Test Manager can pause mid-workflow on Copilot to present requirements-analyst findings and wait for updated requirements before continuing.
- **GitHub Copilot SDK** -- migrated from Claude Agent SDK to GitHub Copilot SDK (Agent mode) as the primary provider. Claude Agent SDK is retained for backward compatibility.
- **Anthropic API provider (`anthropic-api`)** -- direct API access to Claude models without the Claude Code CLI.
- **8 new Playwright execution agents** -- 18 agents total (10 planning + 8 execution).
- **90 prompt templates** -- up from 50 (5 per agent across 18 agents).
- **Playwright TypeScript framework scaffold** -- full project structure with Page Object Model pattern, custom fixtures, data factories, and auth caching.
- **3 new CLI commands** -- `playwright-gen`, `playwright-run`, `playwright-analyze` for end-to-end Playwright workflows from the terminal.
- **Multi-model support** -- GPT-4o, Claude Sonnet, o3-mini, Gemini 2.5 Pro via Copilot; plus direct Anthropic API, Claude Agent SDK, OpenAI, and local model access.
- **SDK adapter layer** -- provider-agnostic `AgentDefinition` dataclass so agent modules work with any backend.
- **Automatic result saving** -- each agent's output is saved to `outputs/{agent-name}/` with timestamped filenames.
- **Interactive Q&A** -- multi-turn conversation where agents can ask follow-up questions directly in the terminal (supported on `anthropic-api` and `openai` providers).
- **CLI tool** (`qa-agent`) with 8 subcommands for running agents from the terminal.
- **Python API** for programmatic integration.
- **Configurable models** via a single `models.yaml` file.

---

## Architecture

```
                          +--------------------+
                          |    Test Manager    |
                          |   (Orchestrator)   |
                          +---------+----------+
                                    |
            +----------+-----------+-----------+----------+
            |          |           |           |          |
     +------+---+ +----+-----+ +--+-----+ +---+----+ +--+------+
     | Test     | | Require- | | Bug    | |Regress-| |   AI    |
     | Case     | | ments    | |Pattern | |  ion   | |  Test   |
     | Generator| | Analyst  | |Analyst | |Optimiz.| |Architect|
     +----------+ +----------+ +--------+ +--------+ +---------+
            |          |           |           |          |
     +------+---+ +----+-----+ +--+-----+ +---+----+
     |Synthetic | |  Test    | | Test   | |Testware|
     |  Data    | | Oracle   | |Results | |Creator |
     |Designer  | | Creator  | |Analyst | |        |
     +----------+ +----------+ +--------+ +--------+

     --- Playwright Execution Agents ---

     playwright-test-generator   ui-test-designer
     api-coverage-planner        pr-hygiene-checker
     security-scout              coverage-hunter
     flake-triage                seed-data-manager
```

```
qa_ecosystem/
├── agents/           # 18 agent definitions (10 planning + 8 execution)
├── templates/        # 18 YAML files with 90 prompt templates
├── sdk_adapter.py    # Provider-agnostic AgentDefinition dataclass
├── runner.py         # Multi-provider execution engine (Copilot, Anthropic API, Claude, OpenAI)
├── models.py         # Model profile abstraction and resolver
├── models.yaml       # Model configuration (Copilot, Anthropic API, Claude, OpenAI, local)
├── config.py         # Tool sets, agent registry, constants
├── cli.py            # CLI entry point with 8 subcommands
└── __init__.py
playwright/           # Playwright TypeScript framework scaffold
├── playwright.config.ts
├── pages/            # Page Object Model classes
├── fixtures/         # Custom test fixtures
├── helpers/          # Timeouts, env, API helpers
├── test-data/        # Data factory
├── auth/             # Auth state caching
└── tests/            # UI and API test specs
docs/
├── QA_CONTEXT.md     # Playwright conventions and patterns
└── PROMPT_LIBRARY.md # Copy-paste prompts for all 18 agents
outputs/              # Auto-created on first run
├── manager_instructions.md   # Test Manager delegation plans
└── {agent-name}/             # One folder per agent
    └── YYYY-MM-DD_HH-MM-SS.md  # Timestamped result files
```

---

## All 18 Agents

| # | Agent | Category | Purpose |
|---|-------|----------|---------|
| 1 | `test-case-generator` | Planning | ISTQB test cases from PBIs |
| 2 | `requirements-analyst` | Planning | PBI ambiguity detection and gap analysis |
| 3 | `bug-pattern-analyst` | Planning | Bug report pattern and trend analysis |
| 4 | `regression-optimizer` | Planning | Optimized regression suites |
| 5 | `ai-test-architect` | Planning | AI/ML test strategy and compliance |
| 6 | `synthetic-data-designer` | Planning | Privacy-safe test data design |
| 7 | `test-manager` | Planning | Orchestrator with 20 workflows |
| 8 | `test-oracle-creator` | Planning | Expected results and validation rules |
| 9 | `test-results-analyst` | Planning | Test execution analysis and failure trends |
| 10 | `testware-creator` | Planning | Professional QA documentation |
| 11 | `playwright-test-generator` | Execution | Generate Playwright TypeScript tests |
| 12 | `ui-test-designer` | Execution | POM-based UI tests, accessibility selectors |
| 13 | `api-coverage-planner` | Execution | API test coverage matrix |
| 14 | `pr-hygiene-checker` | Execution | 8-check code quality gate |
| 15 | `security-scout` | Execution | Secrets and vulnerability scanning |
| 16 | `coverage-hunter` | Execution | Test coverage gap analysis |
| 17 | `flake-triage` | Execution | Flaky test diagnosis and fix |
| 18 | `seed-data-manager` | Execution | Test data factories and fixtures |

Each agent has **5 prompt templates**. View them with:

```bash
qa-agent list-templates --agent <agent-name>
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ (for Playwright)
- GitHub Copilot subscription (recommended) or Anthropic / OpenAI API key

### Installation

```bash
# Clone the repo
git clone https://github.com/paveltspavlov/QA-Agent-Ecosystem.git
cd QA-Agent-Ecosystem

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Linux/macOS
.venv\Scripts\activate             # Windows CMD
.venv\Scripts\Activate.ps1         # Windows PowerShell

# Install base dependencies
pip install setuptools
pip install -e .

# For GitHub Copilot (recommended)
pip install -e ".[copilot]"
gh auth login

# For Claude Agent SDK (backward compatibility)
pip install -e ".[claude]"

# For direct Anthropic API (no CLI needed)
pip install -e ".[anthropic]"
pip install anthropic

# For OpenAI / local models
pip install -e ".[openai]"

# Install all providers
pip install -e ".[all]"

# Set up Playwright (optional)
cd playwright && npm install && npx playwright install --with-deps
```

### Set your API key

```bash
# Anthropic API
export ANTHROPIC_API_KEY=sk-ant-...        # Linux/macOS
set ANTHROPIC_API_KEY=sk-ant-...           # Windows CMD
$env:ANTHROPIC_API_KEY="sk-ant-..."        # Windows PowerShell

# OpenAI
export OPENAI_API_KEY=sk-...
```

> Get your Anthropic API key at [console.anthropic.com](https://console.anthropic.com) -- you need API credits (not a Claude.ai subscription).

### Run your first agent

```bash
qa-agent run test-case-generator --input examples/sample_pbi.md
```

---

## Model Configuration

All model configuration lives in a single file: `qa_ecosystem/models.yaml`.

### Providers

| Provider | Description |
|----------|-------------|
| `copilot` | GitHub Copilot SDK (Agent mode) -- GPT-4o, Claude Sonnet, o3-mini, Gemini |
| `anthropic-api` | Direct Anthropic API -- works everywhere, no CLI needed |
| `claude` | Anthropic Claude via Claude Agent SDK (backward compatibility) |
| `openai` | OpenAI GPT models via the OpenAI SDK |
| `openai-compatible` | Any OpenAI-compatible server -- Ollama, LM Studio, vLLM, Together, Groq |

### Role Mapping

The `roles` section in `models.yaml` maps logical roles to model profiles. Every agent uses the `default` role unless overridden by the role mapping or a CLI flag.

```yaml
roles:
  default: claude-sonnet-api       # planning subagents
  orchestrator: claude-opus-api    # test-manager
  playwright: copilot-gpt4o       # Playwright execution agents
  analysis: copilot-o3-mini        # analysis agents (coverage, hygiene, security)
```

### Pre-configured Model Profiles

| Profile | Provider | Model | Notes |
|---------|----------|-------|-------|
| `copilot-gpt4o` | GitHub Copilot | GPT-4o | |
| `copilot-o3-mini` | GitHub Copilot | o3-mini | |
| `copilot-gemini` | GitHub Copilot | Gemini 2.5 Pro | |
| `claude-sonnet-api` | Anthropic API | claude-sonnet-4-5 | **Default** -- no CLI needed |
| `claude-opus-api` | Anthropic API | claude-opus-4-5 | **Default orchestrator** |
| `claude-haiku-api` | Anthropic API | claude-haiku-4-5 | Fastest/cheapest Claude |
| `claude-sonnet` | Claude Agent SDK | Latest Sonnet | Requires Claude Code CLI + credits |
| `claude-opus` | Claude Agent SDK | Latest Opus | Requires Claude Code CLI + credits |
| `claude-haiku` | Claude Agent SDK | Latest Haiku | Requires Claude Code CLI + credits |
| `gpt-4o` | OpenAI | GPT-4o | Requires `pip install openai` |
| `gpt-4o-mini` | OpenAI | GPT-4o Mini | Requires `pip install openai` |
| `ollama-llama3` | Ollama (local) | Llama 3.1 | No API key needed |
| `ollama-qwen` | Ollama (local) | Qwen 2.5 | No API key needed |
| `ollama-deepseek` | Ollama (local) | DeepSeek R1 | No API key needed |
| `lmstudio` | LM Studio (local) | Default loaded model | No API key needed |
| `vllm-local` | vLLM (local) | Default served model | No API key needed |
| `together-llama` | Together AI | Llama 3.1 70B | Requires `TOGETHER_API_KEY` |
| `groq-llama` | Groq | Llama 3.3 70B | Requires `GROQ_API_KEY` |

### Environment Variables

| Provider | Env Variable | How to Set |
|----------|-------------|------------|
| copilot | (automatic) | `gh auth login` |
| anthropic-api | `ANTHROPIC_API_KEY` | `export ANTHROPIC_API_KEY=sk-ant-...` |
| claude | `ANTHROPIC_API_KEY` | `export ANTHROPIC_API_KEY=sk-ant-...` |
| openai | `OPENAI_API_KEY` | `export OPENAI_API_KEY=sk-...` |
| ollama | `OLLAMA_API_KEY` | Set to any value (Ollama ignores keys) |

You can also override the config file location:

```bash
export QA_MODELS_CONFIG=/path/to/custom/models.yaml
```

### Use a different model per run

```bash
qa-agent run test-case-generator --input examples/sample_pbi.md --model claude-haiku-api
qa-agent run bug-pattern-analyst --input bugs.csv --model gpt-4o
qa-agent run requirements-analyst --input story.md --model ollama-llama3
qa-agent run ui-test-designer --input spec.md --model copilot-gpt4o
```

### Adding a Custom Model Profile

Add a new entry under `profiles:` in `models.yaml`:

```yaml
profiles:
  my-local-mistral:
    provider: openai-compatible
    model_id: mistral
    api_base: http://localhost:11434/v1
    api_key_default: "ollama"
    temperature: 0.3
    max_tokens: 4096
```

Then use it from the CLI:

```bash
qa-agent run test-case-generator --input examples/sample_pbi.md --model my-local-mistral
```

---

## CLI Reference

The `qa-agent` CLI provides 8 subcommands covering discovery, execution, orchestration, and Playwright workflows.

**Common flags:**
- `--input / -i` -- path to a file OR inline text (required for `run` and `orchestrate`)
- `--template / -t` -- template name (default: `default`)
- `--model / -m` -- model profile from `models.yaml`

### Discovery Commands

```bash
# List all 18 agents
qa-agent list-agents

# List all 90 prompt templates
qa-agent list-templates

# List templates for a specific agent
qa-agent list-templates --agent playwright-test-generator

# List all configured model profiles
qa-agent list-models
```

### Run a Single Agent

```bash
# Basic run with default model
qa-agent run test-case-generator -i requirements.md

# Use a specific template and model
qa-agent run test-case-generator -i requirements.md -t risk-based -m copilot-gpt4o

# Use a local model
qa-agent run test-case-generator -i requirements.md -m ollama-llama3

# Pass inline text instead of a file
qa-agent run requirements-analyst -i "As a user I want to reset my password"
```

### Orchestrate (Test Manager Delegates to Agents)

```bash
# Full orchestration -- Test Manager decomposes and delegates
qa-agent orchestrate -i project_context.md

# Orchestrate with a specific workflow template
qa-agent orchestrate -i project_context.md -t playwright-gen
```

### Playwright Commands

```bash
# Generate Playwright tests from a URL
qa-agent playwright-gen --url https://myapp.com

# Generate with a specific agent and model
qa-agent playwright-gen --url https://myapp.com --agent ui-test-designer -m copilot-gpt4o

# Run Playwright tests with optional analysis
qa-agent playwright-run --project chromium --analyze
qa-agent playwright-run --project api --reporter json

# Analyze existing test code
qa-agent playwright-analyze --agent pr-hygiene-checker -i playwright/tests/
qa-agent playwright-analyze --agent security-scout -i playwright/
qa-agent playwright-analyze --agent flake-triage -i playwright/tests/ui/login.spec.ts
```

---

## Output & Result Saving

Every agent run automatically saves its result to the `outputs/` folder.

```
outputs/
├── manager_instructions.md        <- all Test Manager delegation plans (appended per session)
├── test-manager/
│   └── 2026-03-17_14-30-00.md
├── test-case-generator/
│   └── 2026-03-17_14-32-10.md
├── requirements-analyst/
│   └── 2026-03-17_14-33-05.md
└── ...
```

- Each agent gets its own subfolder under `outputs/`.
- Files are named by timestamp (`YYYY-MM-DD_HH-MM-SS.md`) so runs never overwrite each other.
- When running the orchestrator, the Test Manager's delegation plan is also appended to `outputs/manager_instructions.md` with a session header.

---

## Interactive Q&A

When using the `anthropic-api` or `openai` providers, agents support multi-turn conversation. If an agent needs clarification, it will pause and prompt you directly in the terminal:

```
Agent is asking a question. Type your reply (or press Enter to skip):
> _
```

- Type your answer and press **Enter** -- the agent will continue with your input.
- Press **Enter with no text** to skip and let the agent finish without a reply.
- The loop repeats for as long as the agent keeps asking questions.

This enables a back-and-forth dialogue where agents can request missing context, clarify requirements, or refine their output based on your feedback.

---

## Orchestration Workflows

The Test Manager supports 20 orchestration workflows. When you run `qa-agent orchestrate`, the Test Manager analyzes the objective, selects the appropriate workflow, and delegates to specialist agents.

> **Copilot users:** the Test Manager will pause mid-workflow and prompt you for input when requirements need clarification (after the `requirements-analyst` step). Type your updated requirements in the terminal and press Enter to continue.

---

### Workflow 1 -- New Feature Testing

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

**CLI command:**
```bash
qa-agent orchestrate -i feature_requirements.md -m copilot-gpt4o
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

### Workflow 2 -- Bug Prevention and Root Cause

**When to use:** After a bug cluster or production incident — find the root cause and close the coverage gap.

```
bug-pattern-analyst
  -> requirements-analyst  (spec gaps?)
  -> test-case-generator  (new validations)
  -> regression-optimizer
  -> testware-creator (Defect Report)
```

**CLI command:**
```bash
qa-agent orchestrate -i bug_reports.md -m copilot-gpt4o
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

### Workflow 3 -- Sprint/Release Regression

**When to use:** End of sprint or before a release — build an optimized regression suite.

```
regression-optimizer
  -> synthetic-data-designer
  -> test-oracle-creator  (revalidation criteria)
  -> ai-test-architect  (if AI features are involved)
  -> testware-creator (Test Summary Report)
```

**CLI command:**
```bash
qa-agent orchestrate -i sprint_context.md -m copilot-gpt4o
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

### Workflow 4 -- Playwright Test Generation

**When to use:** Automating a web app from scratch or adding automation to a new section.

```
playwright-test-generator  (explore site via CLI, discover pages and user journeys)
  -> ui-test-designer  (create Page Object Model classes)
  -> seed-data-manager  (set up fixtures and data factories)
  -> coverage-hunter  (verify coverage against requirements)
  -> pr-hygiene-checker  (quality gate before commit)
```

**CLI command:**
```bash
qa-agent orchestrate -i playwright_task.md -m copilot-gpt4o
# or use the dedicated shortcut:
qa-agent playwright-gen --url https://myapp.com -m copilot-gpt4o
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

### Workflow 5 -- Flaky Test Investigation

**When to use:** CI is showing intermittent test failures that don't reproduce reliably.

```
flake-triage  (diagnose root causes — race conditions, timing, external dependencies)
  -> test-results-analyst  (trend analysis across recent runs)
  -> playwright-test-generator  (rewrite flaky tests with proper waiting strategies)
  -> pr-hygiene-checker  (validate the fix before merge)
```

**CLI command:**
```bash
qa-agent orchestrate -i flaky_tests.md -m copilot-gpt4o
# or:
qa-agent playwright-analyze --agent flake-triage -i playwright/tests/
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

### Workflow 6 -- UI Mockup vs Implementation Comparison

**When to use:** Validating that a developed feature matches its design mockup. The Test Manager will pause after requirements analysis to let you confirm or update requirements before dispatching Playwright agents.

```
requirements-analyst  (review requirements + mockup for ambiguities)
  -> request_human_input  (present questions, wait for updated requirements)
  -> playwright-test-generator  (navigate live app, take full-page screenshots of all relevant pages)
  -> ui-test-designer  (compare screenshots against mockup, list all deviations with severity)
  -> testware-creator  (format each deviation as a structured Bug Report, save to outputs/)
```

**CLI command:**
```bash
qa-agent orchestrate -i mockup_comparison_task.md -m copilot-gpt4o
```

**Prompt template** (contents of `mockup_comparison_task.md`):
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

**What the output looks like:**

Each bug found is saved as a structured Markdown report in `outputs/testware-creator/`:

```markdown
**Bug ID:** BUG-001
**Title:** "Sign in" button uses wrong background color on mobile
**Severity:** Medium
**Priority:** P3
**Environment:** Chrome 120, Windows 11, https://myapp.com, 375×812
**Mockup Reference:** designs/feature-login-v2.png — mobile login section
**Screenshot (Actual):** outputs/screenshots/login-mobile-375.png

**Steps to Reproduce:**
1. Open https://myapp.com/login on a 375px viewport
2. Observe the "Sign in" button

**Expected (per mockup):** Button background #1A73E8 (brand blue)
**Actual (implemented):** Button background #4285F4 (incorrect shade)
**Suggested Fix:** Update the button's CSS class to use `var(--color-primary)`
```

---

### Workflow 7 -- Full API Test Coverage

**When to use:** Planning or auditing REST API test coverage for a service.

```
requirements-analyst  (validate API requirements and spec completeness)
  -> api-coverage-planner  (build coverage matrix: method × endpoint × auth × status codes)
  -> playwright-test-generator  (generate Playwright APIRequestContext test skeletons)
  -> coverage-hunter  (verify all endpoints and edge cases are covered)
  -> pr-hygiene-checker  (quality gate on generated test code)
  -> testware-creator  (API Coverage Report)
```

**CLI command:**
```bash
qa-agent orchestrate -i api_coverage_task.md -m copilot-gpt4o
# or use the dedicated shortcut:
qa-agent playwright-analyze --agent api-coverage-planner -i src/routes/
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

### Workflow 8 -- Security Audit

**When to use:** Before a release, after adding new dependencies, or as a regular security hygiene check.

```
security-scout  (scan for hardcoded secrets, unsafe patterns, committed .env files, dangerous constructs)
  -> coverage-hunter  (check whether security test scenarios exist for discovered risk areas)
  -> testware-creator  (Security Audit Report: findings by severity, remediation roadmap)
```

**CLI command:**
```bash
qa-agent orchestrate -i security_audit_task.md -m copilot-gpt4o
# or target a specific directory:
qa-agent playwright-analyze --agent security-scout -i playwright/
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

### Workflow 9 -- Test Data & Fixture Bootstrap

**When to use:** Starting a new feature that requires realistic test data, or when test data is brittle and causing failures.

```
requirements-analyst  (extract data entities and edge-case values from PBIs)
  -> synthetic-data-designer  (design privacy-safe datasets covering boundary and negative cases)
  -> seed-data-manager  (implement fixtures, factories, seeding scripts, and teardown helpers)
  -> coverage-hunter  (verify data scenarios cover all acceptance criteria)
  -> testware-creator  (Data Setup Documentation: factory catalogue, seeding instructions)
```

**CLI command:**
```bash
qa-agent orchestrate -i data_bootstrap_task.md -m copilot-gpt4o
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

### Workflow 10 -- Full Test Health Audit

**When to use:** When CI is slow, tests are unreliable, or coverage is unknown — get a full health picture and a prioritized improvement plan.

```
flake-triage  (diagnose unstable tests)
  -> coverage-hunter  (map coverage gaps across pages, endpoints, and user journeys)
  -> regression-optimizer  (recommend a lean, risk-prioritized regression suite)
  -> pr-hygiene-checker  (quality gate on the full test codebase)
  -> testware-creator  (Test Health Report: flaky inventory, gap map, suite recommendation)
```

**CLI command:**
```bash
qa-agent orchestrate -i health_audit_task.md -m copilot-gpt4o
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

### Workflow 11 -- Cross-Browser Compatibility Testing

**When to use:** Verifying that features work correctly across Chromium, Firefox, and WebKit before a release.

```
ui-test-designer  (configure multi-browser matrix: chromium, firefox, webkit)
  -> playwright-test-generator  (generate or adapt tests for all browser projects)
  -> coverage-hunter  (verify all key user paths run in every browser)
  -> testware-creator  (Cross-Browser Compatibility Report: per-browser results, failures)
```

**CLI command:**
```bash
qa-agent orchestrate -i cross_browser_task.md -m copilot-gpt4o
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

### Workflow 12 -- Responsive & Mobile Testing

**When to use:** Verifying layout and interactions at multiple viewport sizes before shipping a UI change.

```
ui-test-designer  (configure viewport sizes: 375px mobile, 768px tablet, 1280px desktop)
  -> playwright-test-generator  (generate viewport-specific scenarios and screenshot comparisons)
  -> coverage-hunter  (verify all pages tested at every breakpoint)
  -> testware-creator  (Responsive Testing Report: per-viewport screenshots, layout issues)
```

**CLI command:**
```bash
qa-agent orchestrate -i responsive_task.md -m copilot-gpt4o
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

### Workflow 13 -- AI/ML Feature Testing

**When to use:** Testing features that use machine learning models, AI-generated content, recommendations, or classification systems.

```
requirements-analyst  (identify non-determinism risks, bias scenarios, compliance requirements)
  -> request_human_input  (clarify acceptable thresholds and compliance constraints)
  -> ai-test-architect  (design strategy: bias checks, drift detection, adversarial inputs)
  -> test-case-generator  (generate AI-specific test cases including edge cases)
  -> synthetic-data-designer  (create adversarial, boundary, and bias-probe datasets)
  -> testware-creator  (AI Test Strategy Document with compliance checklist)
```

**CLI command:**
```bash
qa-agent orchestrate -i ai_feature_task.md -m copilot-gpt4o
```

**Prompt template:**
```
Run Workflow 13 — AI/ML Feature Testing.

Feature: [e.g., "Product recommendation engine", "Sentiment classifier", "Resume screening AI"]
Model type: [e.g., "Collaborative filtering", "LLM-based", "Binary classifier"]
Non-determinism handling: [e.g., "Results may vary by ±5% across runs — use similarity threshold"]
Bias risks: [e.g., "Must not discriminate by gender or age in recommendations"]
Compliance: [e.g., "GDPR, EU AI Act — explainability required"]
Acceptable accuracy threshold: [e.g., "≥ 90% precision on test set"]
```

---

### Workflow 14 -- Release Sign-off / Go-Live Checklist

**When to use:** Final QA gate before deploying to production. Runs all checks and produces a stakeholder-ready sign-off document.

```
requirements-analyst  (verify all in-scope requirements have test coverage)
  -> regression-optimizer  (run risk-prioritized regression subset)
  -> security-scout  (final scan: secrets, unsafe patterns, staging URLs)
  -> coverage-hunter  (confirm coverage meets release threshold)
  -> pr-hygiene-checker  (final quality gate on the test suite)
  -> testware-creator  (Release Sign-off Report: gate results, pass/fail verdict)
```

**CLI command:**
```bash
qa-agent orchestrate -i release_signoff_task.md -m copilot-gpt4o
```

**Prompt template:**
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

### Workflow 15 -- End-to-End User Journey Mapping & Automation

**When to use:** Automating full business flows from a user's perspective — from first interaction to goal completion.

```
requirements-analyst  (extract user journeys and acceptance criteria from personas)
  -> playwright-test-generator  (explore app, map actual navigation flows)
  -> ui-test-designer  (implement E2E journey tests with full POM coverage per persona)
  -> seed-data-manager  (set up journey-specific test data and teardown helpers)
  -> coverage-hunter  (verify every journey step is covered)
  -> testware-creator  (User Journey Test Catalogue with persona-flow-test mapping)
```

**CLI command:**
```bash
qa-agent orchestrate -i user_journey_task.md -m copilot-gpt4o
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

### Workflow 16 -- Test Data Cleanup & Maintenance

**When to use:** When fixtures are stale, factories produce collisions, or test data no longer reflects the current data model.

```
coverage-hunter  (audit fixtures: identify stale, duplicate, or incomplete datasets)
  -> seed-data-manager  (remove stale fixtures, consolidate duplicates, refresh values)
  -> synthetic-data-designer  (redesign datasets that no longer cover current requirements)
  -> testware-creator  (Data Maintenance Report: what changed, updated factory catalogue)
```

**CLI command:**
```bash
qa-agent orchestrate -i data_cleanup_task.md -m copilot-gpt4o
```

**Prompt template:**
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

### Workflow 17 -- Exploratory Testing Session Planner

**When to use:** Preparing a structured exploratory testing effort for a new feature, release, or high-risk area.

```
requirements-analyst  (identify ambiguous, high-risk, or poorly-specified areas)
  -> bug-pattern-analyst  (review historical bugs to guide exploration priorities)
  -> test-oracle-creator  (define expected behavior and pass/fail criteria for explorers)
  -> testware-creator  (Exploratory Testing Charters: goals, time boxes, risk areas, heuristics)
```

**CLI command:**
```bash
qa-agent orchestrate -i exploratory_task.md -m copilot-gpt4o
```

**Prompt template:**
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

### Workflow 18 -- PR / Code Review QA Gate

**When to use:** Before merging a PR that contains test code changes — get a structured pass/fail verdict across hygiene, security, coverage, and flake risk.

```
pr-hygiene-checker  (8-check quality gate: selectors, waiting, structure, naming)
  -> security-scout  (scan changed files for secrets and unsafe patterns)
  -> coverage-hunter  (coverage delta: new code paths without test coverage)
  -> flake-triage  (flake risk assessment of new or modified tests)
  -> testware-creator  (PR QA Gate Report: pass/fail per check, actionable feedback)
```

**CLI command:**
```bash
qa-agent orchestrate -i pr_gate_task.md -m copilot-gpt4o
# or use the dedicated shortcut:
qa-agent playwright-analyze --agent pr-hygiene-checker -i playwright/tests/
```

**Prompt template:**
```
Run Workflow 18 — PR / Code Review QA Gate.

PR branch: [branch name]
Changed test files:
  - playwright/tests/ui/checkout.spec.ts  (modified)
  - playwright/pages/checkout.page.ts  (new)
  - playwright/fixtures/order.fixture.ts  (new)
Changed source files: [optional — list if you want coverage delta analysis]
PR description: [paste PR title and summary]
```

---

### Workflow 19 -- Post-Deployment Smoke Verification

**When to use:** Immediately after deploying to staging or production — verify the critical paths are working before announcing the release.

```
playwright-test-generator  (identify or generate critical smoke tests for key paths)
  -> coverage-hunter  (verify smoke suite covers all critical entry points)
  -> testware-creator  (Smoke Verification Report: pass/fail per path, environment, issues)
```

**CLI command:**
```bash
qa-agent orchestrate -i smoke_task.md -m copilot-gpt4o
# or run the smoke suite directly:
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

### Workflow 20 -- Requirements Traceability Audit

**When to use:** Ensuring every requirement has at least one test case, identifying coverage gaps before a sign-off or audit.

```
requirements-analyst  (catalogue all requirements, user stories, and acceptance criteria)
  -> coverage-hunter  (map existing tests to requirements, identify uncovered items)
  -> test-case-generator  (generate missing test cases for uncovered requirements)
  -> testware-creator  (Traceability Matrix: Requirement ID <-> Test Case IDs <-> Coverage %)
```

**CLI command:**
```bash
qa-agent orchestrate -i traceability_task.md -m copilot-gpt4o
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

## Playwright Framework

The `playwright/` directory contains a TypeScript framework scaffold following production best practices.

### Key Patterns

- **Selector strategy** -- `getByRole` first, then `getByTestId`, never CSS/XPath unless unavoidable.
- **No hardcoded sleeps** -- named timeouts and `waitFor` conditions instead of `page.waitForTimeout()`.
- **Auth caching** -- authentication state is cached via a setup project so tests skip the login flow.
- **TestData factory** -- generates unique per-run data to avoid collisions between parallel workers.
- **Page Object Model** -- every page has a class in `pages/` encapsulating selectors and actions.

### Directory Layout

```
playwright/
├── playwright.config.ts    # Projects: chromium, firefox, webkit, api, mobile
├── pages/                  # Page Object Model classes
├── fixtures/               # Custom test fixtures (authenticated page, API client)
├── helpers/                # Timeout constants, env config, API helpers
├── test-data/              # Data factory for unique test data
├── auth/                   # Cached auth state (.auth/ in .gitignore)
└── tests/
    ├── ui/                 # UI end-to-end tests
    └── api/                # API integration tests
```

---

## Provider Behavior

| Provider | Tool Use | Subagent Delegation | Permission Approval | Best For |
|----------|----------|---------------------|---------------------|----------|
| `copilot` | Yes | Yes | Interactive (per-action or approve-all) | Full orchestration, Playwright agents, multi-model |
| `anthropic-api` | No | No | N/A | **Recommended** -- works everywhere, no CLI needed |
| `claude` | Yes | Yes | `acceptEdits` (auto) | Full orchestration, backward compatibility |
| `openai` | No | No | N/A | Cost-effective drafting, GPT-based analysis |
| `openai-compatible` | No | No | N/A | Local experimentation, privacy, offline use |

- **Copilot** runs through the GitHub Copilot SDK with full tool access and subagent delegation. Every tool action (shell commands, file writes, URL fetches) prompts the user for approval. You can approve one-by-one (`y`), approve all remaining actions in the session (`a`), or deny (`n`). Supports routing to GPT-4o, o3-mini, Gemini, and Claude Haiku within a single session.
- **Anthropic API** calls the Anthropic Messages API directly. No CLI or external tools needed -- just set `ANTHROPIC_API_KEY`. Supports interactive Q&A.
- **Claude** runs through the Claude Agent SDK with full access to file tools (Read, Write, Edit, Grep, Glob, Bash) and the Agent tool for subagent delegation.
- **OpenAI / OpenAI-compatible** runs via the OpenAI Chat Completions API. The agent's system prompt is sent as a system message and the user prompt as a user message. Responses are streamed. Supports interactive Q&A.

> **Note:** Full subagent delegation (where the Test Manager actually invokes the other agents) requires the `copilot` or `claude` provider. The `anthropic-api` and `openai` providers produce comprehensive QA plans but do not have tool access for live delegation.

---

## Python API

You can also use the ecosystem programmatically:

```python
import asyncio
from qa_ecosystem.runner import run_single_agent, run_orchestrator

# Single agent
result = asyncio.run(run_single_agent(
    agent_name="test-case-generator",
    prompt="Generate test cases for a login feature with MFA",
    model_override="copilot-gpt4o",
))

# Orchestrator
result = asyncio.run(run_orchestrator(
    prompt="Full QA strategy for a payment processing module",
    model_override="claude-opus-api",
))
```

---

## Extending the Ecosystem

To add a new agent:

1. **Create the agent module** at `qa_ecosystem/agents/my_agent.py` following the existing pattern. Import `AgentDefinition` from `qa_ecosystem.sdk_adapter`, define `AGENT_NAME`, `DESCRIPTION`, `SYSTEM_PROMPT`, build an `AgentDefinition`, and call `register_agent()`.

2. **Create the template file** at `qa_ecosystem/templates/my_agent.yaml` with 5 prompt templates.

3. **Register the agent name** by adding it to the `AGENT_NAMES` list in `qa_ecosystem/config.py`. If it is a Playwright agent, also add it to `PLAYWRIGHT_AGENT_NAMES`.

4. **Add the import** in `qa_ecosystem/agents/__init__.py` inside the `_ensure_loaded()` function so the agent self-registers on startup.

---

## License

MIT
