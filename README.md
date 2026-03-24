# QA Agent Ecosystem v2.0

18 AI-powered QA agents (10 planning + 8 Playwright execution) with multi-provider model support, orchestrated by a Test Manager. Built on the GitHub Copilot SDK (Agent mode) as the primary provider, with backward compatibility for direct Anthropic API access, Claude Agent SDK, OpenAI, and local models.

You can run agents individually or let the Test Manager orchestrator decompose a complex testing task, delegate to specialists in parallel, and consolidate the results.

---

## What's New in v2.0

- **10 orchestration workflows** -- 5 planning workflows + 5 new Playwright-focused workflows (UI mockup comparison, API coverage, security audit, test data bootstrap, test health audit).
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
| 7 | `test-manager` | Planning | Orchestrator with 10 workflows |
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
  analysis: copilot-claude-sonnet  # analysis agents (coverage, hygiene, security)
```

### Pre-configured Model Profiles

| Profile | Provider | Model | Notes |
|---------|----------|-------|-------|
| `copilot-gpt4o` | GitHub Copilot | GPT-4o | |
| `copilot-claude-sonnet` | GitHub Copilot | Claude Sonnet 4.5 | |
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

The Test Manager supports 10 orchestration workflows. When you run `qa-agent orchestrate`, the Test Manager analyzes the objective, selects the appropriate workflow, and delegates to specialist agents.

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

| Provider | Tool Use | Subagent Delegation | Best For |
|----------|----------|---------------------|----------|
| `copilot` | Yes | Yes | Full orchestration, Playwright agents, multi-model |
| `anthropic-api` | No | No | **Recommended** -- works everywhere, no CLI needed |
| `claude` | Yes | Yes | Full orchestration, backward compatibility |
| `openai` | No | No | Cost-effective drafting, GPT-based analysis |
| `openai-compatible` | No | No | Local experimentation, privacy, offline use |

- **Copilot** runs through the GitHub Copilot SDK with full tool access and subagent delegation. Supports routing to GPT-4o, Claude Sonnet, o3-mini, and Gemini within a single session.
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
