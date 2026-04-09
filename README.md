# QA Agent Ecosystem v2.0

21 AI-powered QA agents (10 planning + 11 Playwright execution) with multi-provider model support, orchestrated by a Test Manager. Built on the GitHub Copilot SDK (Agent mode) as the primary provider, with backward compatibility for direct Anthropic API access, Claude Agent SDK, OpenAI, and local models.

You can run agents individually or let the Test Manager orchestrator decompose a complex testing task, delegate to specialists in parallel, and consolidate the results.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System overview, project structure, provider behavior, Python API, extending the ecosystem |
| [Agents](docs/AGENTS.md) | All 21 agents: purpose, skills, tool sets, v2.1 improvements |
| [Workflow Guide](docs/WORKFLOW_GUIDE.md) | How to run workflows from the terminal — input methods, flags, all 16 workflows with examples |
| [Workflow Reference](docs/WORKFLOWS.md) | 21 orchestration workflows with CLI commands and prompt templates |
| [Models](docs/MODELS.md) | Provider configuration, model profiles, role mapping, environment variables |
| [CLI](docs/CLI.md) | All subcommands: discovery, execution, orchestration, workflows, Playwright |
| [Skills](docs/SKILLS.md) | Shared skills system: how it works, available skills, adding new ones |
| [Prompt Library](docs/PROMPT_LIBRARY.md) | Copy-paste prompts for all 21 agents |
| [Playwright Conventions](docs/QA_CONTEXT.md) | Selector strategy, wait patterns, POM, test isolation, CI integration |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common errors and fixes |

---

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

# Preview execution plan without running (dry run)
qa-agent workflow playwright-gen -i "https://myapp.com" --dry-run

# Skip specific agents
qa-agent workflow playwright-gen -i "https://myapp.com" --skip accessibility-auditor performance-profiler

# Full form via orchestrate (advanced options: reorder, deps, custom YAML)
qa-agent orchestrate -w feature-testing -i requirements.md -m copilot-claude-haiku
```

See the full [CLI Reference](docs/CLI.md), [Workflow Guide](docs/WORKFLOW_GUIDE.md), and [Workflow Reference](docs/WORKFLOWS.md) for all commands and templates.

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
