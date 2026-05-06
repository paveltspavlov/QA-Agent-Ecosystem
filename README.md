# QA Agent Ecosystem v2.0

21 AI-powered QA agents (10 planning + 11 Playwright execution) with multi-provider model support, orchestrated by a Test Manager. Built on the GitHub Copilot SDK (Agent mode) as the primary provider, with backward compatibility for direct Anthropic API access, Claude Agent SDK, OpenAI, and local models.

You can run agents individually or let the Test Manager orchestrator decompose a complex testing task, delegate to specialists in parallel, and consolidate the results.

---

## Table of Contents

### Core Documentation (`docs/`)

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System overview, project structure, provider behavior, Python API, extending the ecosystem |
| [Agents](docs/AGENTS.md) | All 21 agents: purpose, skills, tool sets, v2.1 improvements |
| [CLI Reference](docs/CLI.md) | All subcommands: discovery, execution, orchestration, workflows, Playwright |
| [Models](docs/MODELS.md) | Provider configuration, model profiles (incl. `copilot-claude-haiku`, `copilot-claude-sonnet`), role mapping, `--role` overrides, environment variables |
| [Config Precedence](docs/CONFIG_PRECEDENCE.md) | How `-m`, `--role`, `models.yaml`, and env vars combine (highest → lowest priority) |
| [ADR-001](docs/adr/ADR-001-setup-ux-and-playwright-output-layout.md) | Setup-UX simplification and per-session Playwright output layout |
| [Workflow Guide](docs/WORKFLOW_GUIDE.md) | How to run workflows from the terminal -- input methods, flags, all 16 workflows with examples |
| [Workflow Reference](docs/WORKFLOWS.md) | 21 orchestration workflows with CLI commands, prompt templates, and step-by-step breakdowns |
| [Prompt Library](docs/PROMPT_LIBRARY.md) | 105 copy-paste prompts for all 21 agents (5 per agent) |
| [Skills](docs/SKILLS.md) | Shared prompt skills system: how it works, available skills, adding new ones |
| [Playwright Conventions](docs/QA_CONTEXT.md) | Selector strategy, wait patterns, POM, test isolation, CI integration |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common errors and fixes |

### Guides (root)

| Document | Description |
|----------|-------------|
| [User Guide](GUIDE.md) | Comprehensive user guide -- installation, configuration, running agents, orchestration |
| [GitHub Copilot Guide](COPILOT_GUIDE.md) | Step-by-step setup and usage with GitHub Copilot as the AI provider |
| [Quick Reference](QUICK_REFERENCE.md) | One-page reference card for Playwright test execution results |
| [Playwright Suite](README_PLAYWRIGHT.md) | Playwright automation suite overview -- 35 exploratory test cases converted to automated tests |

### Input Templates (`inputs/`)

Ready-to-fill requirement files. Copy a template, fill in the bracketed placeholders, and pass it to `qa-agent workflow`.

| Template | Workflow Key | Description |
|----------|--------------|-------------|
| [Input Templates README](inputs/README.md) | -- | Overview and usage instructions for all input templates |
| [feature-testing.md](inputs/feature-testing.md) | `feature-testing` | New feature PBI / user story |
| [bug-analysis.md](inputs/bug-analysis.md) | `bug-prevention` | Bug reports and defect history |
| [regression.md](inputs/regression.md) | -- | Sprint scope and existing test suite |
| [playwright-gen.md](inputs/playwright-gen.md) | `playwright-gen` | App URL and pages to automate |
| [flaky-tests.md](inputs/flaky-tests.md) | `flake-investigation` | Flaky test files and CI logs |
| [mockup-comparison.md](inputs/mockup-comparison.md) | -- | Mockup image/file and app URL |
| [api-coverage.md](inputs/api-coverage.md) | `api-coverage` | OpenAPI spec or endpoint list |
| [security-audit.md](inputs/security-audit.md) | `security-audit` | Codebase path and scope |
| [data-bootstrap.md](inputs/data-bootstrap.md) | -- | PBIs and data requirements |
| [health-audit.md](inputs/health-audit.md) | `test-debt` | Test directory and recent results |
| [release-signoff.md](inputs/release-signoff.md) | `release-signoff` | Release version and test scope |
| [pr-gate.md](inputs/pr-gate.md) | -- | PR diff and test files |
| [smoke-verification.md](inputs/smoke-verification.md) | `post-deploy-smoke` | App URL and environment |
| [single-agent.md](inputs/single-agent.md) | -- | Generic single-agent input |
| [pbi-to-report.md](inputs/pbi-to-report.md) | `pbi-to-report` | Full PBI-to-Report pipeline input |

### Showcase Examples (`showcase/`)

Complete, ready-to-run input files with no placeholders -- copy the command and run.

| Example | Description |
|---------|-------------|
| [Showcase README](showcase/README.md) | Overview and instructions for all showcase examples |
| [PBI Shopping Cart](showcase/pbi-shopping-cart.md) | End-to-end shopping cart feature testing |
| [Playwright DemoQA](showcase/playwright-demoqa.md) | Playwright test generation for demoqa.com |
| [UI Checkout Flow](showcase/ui-checkout-flow.md) | UI test design for a checkout flow |
| [API Bookstore](showcase/api-bookstore.md) | API coverage planning for a bookstore API |
| [Flaky Checkout Tests](showcase/flaky-checkout-tests.md) | Diagnosing and fixing flaky checkout tests |
| [Security Audit](showcase/security-audit-playwright.md) | Security audit on Playwright test suite |
| [Health Audit E-commerce](showcase/health-audit-ecommerce.md) | Full test health audit for an e-commerce app |
| [Release Sign-off v3](showcase/release-signoff-v3.md) | Release sign-off checklist for v3.0 |

### Examples (`examples/`)

| File | Description |
|------|-------------|
| [sample_pbi.md](examples/sample_pbi.md) | Sample PBI / user story for testing agents |
| [workflow_requirements_to_report.md](examples/workflow_requirements_to_report.md) | Example: full requirements-to-report workflow |
| [run_single_agent.py](examples/run_single_agent.py) | Python script: run a single agent programmatically |
| [run_orchestrator.py](examples/run_orchestrator.py) | Python script: run the Test Manager orchestrator |

### Test Reports (root)

| Report | Description |
|--------|-------------|
| [Execution Report](EXECUTION_REPORT.md) | Detailed Playwright test execution report for demoqa.com |
| [Test Case Mapping](TEST_CASE_MAPPING.md) | Comprehensive test case traceability table (35 test cases) |
| [Test Case Traceability](TEST_CASE_TRACEABILITY.md) | Test case to implementation mapping matrix |
| [Traceability Map](TRACEABILITY_MAP.md) | Playwright automation test case traceability overview |

---

## What's New in v2.2

- **Session-based output layout** — all artifacts now save under `outputs/{app_name}/{timestamp}/` (one folder per test target / app, one timestamped subfolder per execution). Each session contains `agents/<agent>/result.{md,json}`, `bugs/`, `reports/`, `metrics.json`, `manifest.json` (sha1 + size for every artifact), and `run.log`. A rolling index is appended to `outputs/runs.jsonl` after every run. App name is derived from the URL hostname or prompt (sha1 hash fallback). See `qa_ecosystem/session.py`.
- **New `copilot-claude-sonnet` model profile** — Claude Sonnet 4.5 via GitHub Copilot (temp 0.4, max_tokens 16384), the higher-quality companion to `copilot-claude-haiku`.
- **New CLI commands** — `qa-agent list-sessions` and `qa-agent show-session <app/timestamp>|latest` to browse and inspect sessions.
- **Root-level `--role ROLE=PROFILE` flag (repeatable)** — override the role -> profile mapping from `models.yaml` for a single run.
- **Pydantic v2 schema validation** of structured agent outputs (`qa_ecosystem/schemas.py` + `output_parser.py`); validation errors are logged to stderr and trigger a graceful fallback to the regex parser.
- **Skill-based bug-reporter / report-creator workflows** — long workflow prompts extracted into `qa_ecosystem/skills/bug_reporter_workflow.md` and `report_creator_workflow.md`, composed via the SKILLS list and using `{session_dir}`, `{bugs_dir}`, `{reports_dir}` placeholders.
- **CLI restructure** — `qa_ecosystem/cli.py` is now parser+dispatch wiring; per-command logic lives in `qa_ecosystem/commands/` (`info`, `setup`, `run`, `orchestrate`, `chain`, `playwright`, `sessions`, `checkpoints`, `_shared`).

## What's New in v2.0

- **DAG-based workflow engine** -- 13 predefined workflows in `workflows.yaml` with dependency management and parallel execution via `asyncio.gather()`.
- **21 orchestration workflows** -- covering feature testing, bug analysis, regression, Playwright automation, mockup comparison, API coverage, security audit, cross-browser, responsive, AI/ML, release sign-off, PBI-to-Report full pipeline, and more.
- **Execution plan approval** -- the Test Manager presents its proposed agent sequence for user review before delegation begins.
- **Human-in-the-loop pause** -- the Test Manager can pause mid-workflow to present requirements-analyst findings and wait for updated requirements.
- **GitHub Copilot SDK** -- primary provider with multi-model support (GPT-4o, Claude Sonnet, o3-mini, Gemini).
- **Anthropic API provider** -- direct API access to Claude models without the Claude Code CLI.
- **11 Playwright execution agents** -- including accessibility auditor, performance profiler, and API contract validator.
- **105 prompt templates** -- 5 per agent across 21 agents.
- **Provider module architecture** -- focused provider modules for copilot, claude, anthropic_api, and openai.
- **Token usage and cost tracking** -- per-agent metrics with estimated cost.
- **Webhook notifications** -- `--notify <webhook_url>` flag with Slack Block Kit support.
- **Playwright TypeScript framework scaffold** -- full project structure with POM pattern, custom fixtures, data factories, and auth caching.
- **Multi-model support** -- GPT-4o, Claude Sonnet, o3-mini, Gemini 2.5 Pro via Copilot; plus direct Anthropic API, Claude Agent SDK, OpenAI, and local models.
- **Interactive Q&A** -- multi-turn conversation on `anthropic-api` and `openai` providers.

### Playwright Agent Improvements (v2.1)

- **Flake triage now applies fixes** -- diagnoses flakes, applies fixes directly, verifies stability with `--repeat-each=5`.
- **Trace-based debugging in test-validator** -- `--trace=retain-on-failure` for selector/timeout failure diagnosis.
- **Structured output schema for ui-test-designer** -- reliable artifact extraction with responsive viewport testing.
- **11-check PR quality gate** -- assertion quality, test isolation, and error handling checks added.
- **Inventory builder tracks fixtures and helpers** -- staleness warnings and delta mode for incremental updates.
- **Network API discovery** -- intercepts `fetch`/`xhr` requests during exploration to capture API endpoints.
- **Fixture and helper file extraction** -- output parser extracts `*.fixture.ts` and helper files.
- **Expanded playwright-gen workflow** -- accessibility-auditor and performance-profiler added as parallel steps.

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

# Install the base CLI
pip install setuptools
pip install -e .

# One-shot interactive bootstrap — picks a provider, installs the right Python
# extras, configures `.env`, runs `gh auth login`, installs Playwright, and
# finishes with `qa-agent doctor` so you know everything is wired up.
qa-agent setup
```

<details>
<summary>Manual install (advanced)</summary>

```bash
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

</details>

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

### Run a workflow

```bash
# List all available workflows
qa-agent list-workflows

# Run a workflow with a file input
qa-agent workflow feature-testing -i requirements.md

# Run with a URL input (auto-detected for web-focused workflows)
qa-agent workflow exploratory-testing -i "https://demoqa.com"

# Run the full PBI-to-Report pipeline
qa-agent workflow pbi-to-report -i inputs/pbi-to-report.md

# Use the fast, cost-efficient copilot-claude-haiku model
qa-agent workflow feature-testing -i requirements.md -m copilot-claude-haiku

# Or the higher-quality copilot-claude-sonnet model
qa-agent workflow feature-testing -i requirements.md -m copilot-claude-sonnet

# Override role -> profile mapping just for this run (repeatable)
qa-agent --role default=copilot-claude-sonnet --role orchestrator=claude-opus-api \
  orchestrate -w feature-testing -i requirements.md

# List all sessions saved under outputs/ and inspect a specific one
qa-agent list-sessions
qa-agent show-session latest
qa-agent show-session demoqa-com/2026-04-23_10-15-00

# Preview execution plan without running (dry run)
qa-agent workflow playwright-gen -i "https://myapp.com" --dry-run

# Skip specific agents
qa-agent workflow playwright-gen -i "https://myapp.com" --skip accessibility-auditor performance-profiler

# Full form via orchestrate (advanced options: reorder, deps, custom YAML)
qa-agent orchestrate -w feature-testing -i requirements.md -m copilot-claude-haiku
```

See the full [CLI Reference](docs/CLI.md), [Workflow Guide](docs/WORKFLOW_GUIDE.md), and [Workflow Reference](docs/WORKFLOWS.md) for all commands and templates.

### Playwright test generation & re-runs

Generated Playwright tests are written into the active session, alongside the
reports and bugs for the same run, and never tracked in git (`outputs/` is
gitignored):

```
outputs/
└── demoqa-com/
    └── 2026-05-06_14-30-00/
        ├── playwright-tests/        ← generated *.spec.ts + per-session playwright.config.ts
        ├── reports/
        ├── bugs/
        └── manifest.json
```

```bash
# Generate tests for a target — output dir is auto-resolved to the session
qa-agent playwright-gen --url https://demoqa.com

# Re-run the latest session for that target
qa-agent playwright-run --app demoqa-com

# Or pin a specific session
qa-agent playwright-run --app demoqa-com --session 2026-05-06_14-30-00
```

The committed `playwright/` folder holds the shared scaffold (`playwright.config.ts`,
`fixtures/`, `helpers/`, `pages/`, `auth/`). Each session auto-generates its own
`playwright.config.ts` that extends the scaffold and pins `testDir` to the session.

---

## All 21 Agents

| # | Agent | Category | Purpose |
|---|-------|----------|---------|
| 1 | `test-case-generator` | Planning | ISTQB test cases from PBIs |
| 2 | `requirements-analyst` | Planning | PBI ambiguity detection and gap analysis |
| 3 | `bug-pattern-analyst` | Planning | Bug report pattern and trend analysis |
| 4 | `regression-optimizer` | Planning | Optimized regression suites |
| 5 | `ai-test-architect` | Planning | AI/ML test strategy and compliance |
| 6 | `synthetic-data-designer` | Planning | Privacy-safe test data design |
| 7 | `test-manager` | Planning | Orchestrator with 20+ workflows |
| 8 | `test-oracle-creator` | Planning | Expected results and validation rules |
| 9 | `test-results-analyst` | Planning | Test execution analysis and failure trends |
| 10 | `testware-creator` | Planning | Professional QA documentation |
| 11 | `playwright-test-generator` | Execution | Generate Playwright TypeScript tests |
| 12 | `ui-test-designer` | Execution | POM-based UI tests, accessibility selectors |
| 13 | `api-coverage-planner` | Execution | API test coverage matrix |
| 14 | `pr-hygiene-checker` | Execution | 11-check code quality gate |
| 15 | `security-scout` | Execution | Secrets and vulnerability scanning |
| 16 | `coverage-hunter` | Execution | Test coverage gap analysis |
| 17 | `flake-triage` | Execution | Flaky test diagnosis, fix, and verification |
| 18 | `seed-data-manager` | Execution | Test data factories and fixtures |
| 19 | `accessibility-auditor` | Execution | WCAG 2.1 AA compliance audits via axe-core |
| 20 | `performance-profiler` | Execution | Core Web Vitals and page load profiling |
| 21 | `api-contract-validator` | Execution | OpenAPI spec validation and breaking change detection |

See [Agents](docs/AGENTS.md) for skills, tool sets, and detailed descriptions.

---

## License

MIT
