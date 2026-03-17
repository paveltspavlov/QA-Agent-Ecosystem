# QA Agent Ecosystem

10 specialized AI-powered QA agents orchestrated by a Test Manager, with multi-provider support including direct Anthropic API, OpenAI, Ollama, and more.

## What Is This?

A Python CLI toolkit that brings AI to your QA workflow. Each agent is a domain expert — one generates test cases, another analyzes bug patterns, another designs synthetic data — and a central **Test Manager** orchestrates them all into end-to-end testing workflows.

You can run agents individually or let the orchestrator decompose a complex testing task, delegate to specialists in parallel, and consolidate the results.

### Key Features

- **10 specialized QA agents** with ISTQB-aligned system prompts
- **50 prompt templates** (5 per agent) for common QA scenarios
- **Multi-provider support** — Anthropic API, OpenAI, Ollama, LM Studio, vLLM, Groq, Together
- **CLI tool** (`qa-agent`) for running agents from the terminal
- **Python API** for programmatic integration
- **Configurable models** via a single `models.yaml` file

### Architecture

```
                          ┌──────────────────┐
                          │   Test Manager   │
                          │  (Orchestrator)  │
                          └────────┬─────────┘
                                   │
            ┌──────────┬───────────┼───────────┬──────────┐
            │          │           │           │          │
     ┌──────┴──┐ ┌─────┴────┐ ┌───┴────┐ ┌────┴───┐ ┌───┴─────┐
     │ Test    │ │ Require- │ │ Bug    │ │Regress-│ │   AI    │
     │ Case   │ │ ments    │ │Pattern │ │  ion   │ │  Test   │
     │Generator│ │ Analyst  │ │Analyst │ │Optimiz.│ │Architect│
     └─────────┘ └──────────┘ └────────┘ └────────┘ └─────────┘
            │          │           │           │          │
     ┌──────┴──┐ ┌─────┴────┐ ┌───┴────┐ ┌────┴───┐
     │Synthetic│ │  Test    │ │ Test   │ │Testware│
     │  Data   │ │ Oracle   │ │Results │ │Creator │
     │Designer │ │ Creator  │ │Analyst │ │        │
     └─────────┘ └──────────┘ └────────┘ └────────┘
```

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/paveltspavlov/QA-Agent-Ecosystem.git
cd QA-Agent-Ecosystem

# 2. Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate             # Windows CMD
.venv\Scripts\Activate.ps1         # Windows PowerShell
source .venv/bin/activate          # Linux/macOS

# 3. Install dependencies
pip install setuptools
pip install -e .
pip install anthropic               # direct Anthropic API (no CLI needed)

# 4. Set your API key
set ANTHROPIC_API_KEY=sk-ant-...            # Windows CMD
$env:ANTHROPIC_API_KEY="sk-ant-..."        # Windows PowerShell
export ANTHROPIC_API_KEY=sk-ant-...        # Linux/macOS

# 5. Run your first agent
qa-agent run test-case-generator --input examples/sample_pbi.md
```

> Get your API key at [console.anthropic.com](https://console.anthropic.com) — you need API credits (not a Claude.ai subscription).

---

## User Guide

### Setup

```bash
pip install setuptools
pip install -e .
pip install anthropic

# Optional: OpenAI / local model support
pip install -e ".[openai]"
```

---

### CLI Reference

```bash
qa-agent list-agents                              # show all 10 agents
qa-agent list-models                              # show all model profiles
qa-agent list-templates                           # show all 50 templates
qa-agent list-templates --agent <agent-name>      # templates for one agent

qa-agent run <agent-name> --input <file-or-text>  # run a single agent
qa-agent orchestrate --input <file-or-text>       # run the full orchestrator
```

**Common flags:**
- `--input / -i` — path to a file OR inline text (required)
- `--template / -t` — template name (default: `default`)
- `--model / -m` — model profile from `models.yaml` (default: `claude-sonnet-api`)

---

## Agent Examples

Each agent has 5 templates. The examples below show several per agent.
Pass `--input` a file path or inline text — the default template works for most cases.

---

### 1. test-case-generator

Generates ISTQB-aligned test cases from user stories, features, and tasks.

```bash
# Generate comprehensive test cases from a PBI file
qa-agent run test-case-generator --input examples/sample_pbi.md

# Generate test cases from inline text
qa-agent run test-case-generator --input "As a user I want to reset my password via email"

# Risk-based test cases (prioritised by business impact)
qa-agent run test-case-generator --input examples/sample_pbi.md --template risk-based

# Integration and system test cases
qa-agent run test-case-generator --input examples/sample_pbi.md --template integration-focused

# Acceptance-level test cases
qa-agent run test-case-generator --input examples/sample_pbi.md --template acceptance-test

# Apply a specific ISTQB technique (e.g. boundary value analysis)
qa-agent run test-case-generator --input examples/sample_pbi.md --template technique-specific
```

---

### 2. requirements-analyst

Reviews PBIs and user stories for ambiguities, missing details, and unclear acceptance criteria.

```bash
# Analyse a PBI for clarity and completeness
qa-agent run requirements-analyst --input examples/sample_pbi.md

# Analyse inline text
qa-agent run requirements-analyst --input "As an admin I want to manage user roles"

# Identify ambiguities before a backlog refinement session
qa-agent run requirements-analyst --input examples/sample_pbi.md --template pre-refinement

# Analyse a UI/UX-focused requirement
qa-agent run requirements-analyst --input examples/sample_pbi.md --template ui-focused

# Review a technical task for integration risks
qa-agent run requirements-analyst --input examples/sample_pbi.md --template technical-task

# Break down a feature into analysable components
qa-agent run requirements-analyst --input examples/sample_pbi.md --template feature-breakdown
```

---

### 3. bug-pattern-analyst

Processes bug reports (CSV or plain text) to find patterns, trends, and high-risk areas.

```bash
# Comprehensive analysis of a bug report file
qa-agent run bug-pattern-analyst --input bugs.csv

# Analyse inline bug summary
qa-agent run bug-pattern-analyst --input "Login fails on Safari. Checkout crashes on Android. Password reset email not sent."

# Identify high-risk functionalities from defect data
qa-agent run bug-pattern-analyst --input bugs.csv --template high-risk-areas

# Analyse defect trends over time
qa-agent run bug-pattern-analyst --input bugs.csv --template temporal-trends

# Root cause pattern detection
qa-agent run bug-pattern-analyst --input bugs.csv --template root-cause

# Targeted analysis for a specific module
qa-agent run bug-pattern-analyst --input bugs.csv --template module-specific
```

---

### 4. regression-optimizer

Analyses test suites and creates optimised regression packs based on changes and risk.

```bash
# Build a regression suite for recent changes
qa-agent run regression-optimizer --input tests.csv

# Inline description of what changed
qa-agent run regression-optimizer --input "Payment module refactored. New checkout flow added. Auth service unchanged."

# Optimise the full regression suite (remove redundancy)
qa-agent run regression-optimizer --input tests.csv --template full-optimization

# Sprint or release regression pack
qa-agent run regression-optimizer --input tests.csv --template sprint-release

# Risk-based regression selection
qa-agent run regression-optimizer --input tests.csv --template risk-based

# Maintenance: identify obsolete and redundant tests
qa-agent run regression-optimizer --input tests.csv --template maintenance
```

---

### 5. ai-test-architect

Designs test strategies for AI/ML projects with EU AI Act and ISTQB AI principles applied.

```bash
# Design a test strategy for an AI project
qa-agent run ai-test-architect --input "AI-powered loan approval system using credit scoring ML model"

# Full strategy from a project description file
qa-agent run ai-test-architect --input ai_project.md

# Regulatory-aligned testing blueprint (EU AI Act, GDPR, etc.)
qa-agent run ai-test-architect --input ai_project.md --template regulatory-alignment

# Model performance and risk evaluation
qa-agent run ai-test-architect --input ai_project.md --template model-performance

# Enterprise AI quality governance framework
qa-agent run ai-test-architect --input ai_project.md --template enterprise-governance

# Continuous validation and monitoring plan
qa-agent run ai-test-architect --input ai_project.md --template continuous-validation
```

---

### 6. synthetic-data-designer

Generates privacy-safe, realistic synthetic datasets for testing.

```bash
# Design structured business test data
qa-agent run synthetic-data-designer --input "E-commerce order management system with users, products, orders, payments"

# From a spec file
qa-agent run synthetic-data-designer --input spec.md

# Synthetic data for AI/ML testing
qa-agent run synthetic-data-designer --input spec.md --template ai-ml-testing

# API contract testing payloads
qa-agent run synthetic-data-designer --input spec.md --template api-contract

# Privacy-safe replacement for production data
qa-agent run synthetic-data-designer --input spec.md --template privacy-safe

# Edge-case and negative data pack
qa-agent run synthetic-data-designer --input spec.md --template edge-case-pack
```

---

### 7. test-oracle-creator

Generates precise expected results, validation rules, and acceptance criteria for test cases.

```bash
# Generate expected results for a business logic scenario
qa-agent run test-oracle-creator --input "User with Premium subscription gets 20% discount on orders over $100"

# From a scenarios file
qa-agent run test-oracle-creator --input scenarios.md

# Oracle criteria for AI model outputs
qa-agent run test-oracle-creator --input scenarios.md --template ai-model-output

# Expected results for API test cases
qa-agent run test-oracle-creator --input scenarios.md --template api-response

# Expected results for UI/UX test cases
qa-agent run test-oracle-creator --input scenarios.md --template ui-behavior

# Data integrity validation oracle
qa-agent run test-oracle-creator --input scenarios.md --template data-integrity
```

---

### 8. test-results-analyst

Processes test execution data to find failure trends, flaky tests, and coverage gaps.

```bash
# Analyse sprint test results
qa-agent run test-results-analyst --input results.csv

# Inline results summary
qa-agent run test-results-analyst --input "Sprint 12: 340 passed, 18 failed, 5 blocked. Login suite: 3 failures. Payment suite: 15 failures."

# Release quality gate assessment (go/no-go)
qa-agent run test-results-analyst --input results.csv --template quality-gate

# Flaky test investigation
qa-agent run test-results-analyst --input results.csv --template flaky-test

# Regression impact after code changes
qa-agent run test-results-analyst --input results.csv --template regression-impact

# Quality trend analysis across sprints
qa-agent run test-results-analyst --input results.csv --template cross-sprint-trend
```

---

### 9. testware-creator

Creates professional QA artefacts: test plans, reports, defect reports, traceability matrices.

```bash
# Generate a test plan
qa-agent run testware-creator --input "Mobile banking app — Sprint 5 scope: biometric login, transfer limits, statements"

# From a scope file
qa-agent run testware-creator --input scope.md

# Test summary report for stakeholders
qa-agent run testware-creator --input scope.md --template test-summary-report

# Formal defect report ready for developer handoff
qa-agent run testware-creator --input scope.md --template defect-report

# Requirements-to-test traceability matrix
qa-agent run testware-creator --input scope.md --template traceability-matrix

# Test closure report for project archive
qa-agent run testware-creator --input scope.md --template test-closure-report
```

---

### 10. test-manager (Orchestrator)

Coordinates end-to-end QA workflows by decomposing tasks and delegating to specialist agents.

```bash
# Full test cycle orchestration from a PBI file
qa-agent orchestrate --input examples/sample_pbi.md

# Orchestrate from inline project description
qa-agent orchestrate --input "Payment processing module — new Stripe integration, refund flow, fraud detection"

# Feature release test planning
qa-agent orchestrate --input examples/sample_pbi.md --template feature-release

# Sprint testing coordination
qa-agent orchestrate --input examples/sample_pbi.md --template sprint-coordination

# Risk-driven test planning for a high-stakes release
qa-agent orchestrate --input examples/sample_pbi.md --template risk-driven

# Post-release quality review
qa-agent orchestrate --input examples/sample_pbi.md --template post-release-review
```

> **Note:** The default `anthropic-api` provider calls the Anthropic Messages API directly and produces a comprehensive QA plan. Full subagent delegation (where the Test Manager actually invokes the other 9 agents) requires the `claude` provider via the Claude Agent SDK.

---

## Configure Models

Edit **`qa_ecosystem/models.yaml`** to change which model is used.

### Change the default model

```yaml
roles:
  default: claude-haiku-api      # faster and cheaper for subagents
  orchestrator: claude-opus-api  # more powerful for orchestration
```

### Pre-configured profiles

| Profile | Provider | Model | Notes |
|---------|----------|-------|-------|
| `claude-sonnet-api` | Anthropic API | claude-sonnet-4-5 | **Default** — no CLI needed |
| `claude-opus-api` | Anthropic API | claude-opus-4-5 | **Default orchestrator** |
| `claude-haiku-api` | Anthropic API | claude-haiku-4-5 | Fastest/cheapest Claude |
| `claude-sonnet` | Claude Agent SDK | Latest Sonnet | Requires Claude Code CLI + credits |
| `claude-opus` | Claude Agent SDK | Latest Opus | Requires Claude Code CLI + credits |
| `gpt-4o` | OpenAI | GPT-4o | Requires `pip install openai` |
| `gpt-4o-mini` | OpenAI | GPT-4o Mini | Requires `pip install openai` |
| `ollama-llama3` | Ollama (local) | Llama 3.1 | No API key needed |
| `ollama-qwen` | Ollama (local) | Qwen 2.5 | No API key needed |
| `ollama-deepseek` | Ollama (local) | DeepSeek R1 | No API key needed |
| `lmstudio` | LM Studio (local) | Default loaded model | No API key needed |
| `together-llama` | Together AI | Llama 3.1 70B | Requires `TOGETHER_API_KEY` |
| `groq-llama` | Groq | Llama 3.3 70B | Requires `GROQ_API_KEY` |

### Use a different model per run

```bash
qa-agent run test-case-generator --input examples/sample_pbi.md --model claude-haiku-api
qa-agent run bug-pattern-analyst --input bugs.csv --model gpt-4o
qa-agent run requirements-analyst --input story.md --model ollama-llama3
```

### Add a custom local model

```yaml
profiles:
  my-mistral:
    provider: openai-compatible
    model_id: mistral
    api_base: http://localhost:11434/v1
    api_key_default: "ollama"
    temperature: 0.3
    max_tokens: 4096
```

```bash
qa-agent run test-case-generator --input examples/sample_pbi.md --model my-mistral
```

---

## Run from Python

```python
import asyncio
from qa_ecosystem.runner import run_single_agent, run_orchestrator

# Single agent
result = asyncio.run(run_single_agent(
    agent_name="test-case-generator",
    prompt="Generate test cases for a login feature with MFA",
))

# Orchestrator
result = asyncio.run(run_orchestrator(
    prompt="Full QA strategy for a payment processing module",
))
```

---

## Provider Behavior

| Provider | Requires | Best For |
|----------|----------|----------|
| `anthropic-api` | `ANTHROPIC_API_KEY` + API credits | **Recommended** — works everywhere, no CLI needed |
| `claude` | Claude Code CLI + CLI credits | Full subagent delegation |
| `openai` | `OPENAI_API_KEY` | GPT-based analysis |
| `openai-compatible` | Depends on service | Local/offline use |

---

## Project Structure

```
QA-Agent-Ecosystem/
├── pyproject.toml
├── requirements.txt
├── README.md
├── qa_ecosystem/
│   ├── cli.py                         # CLI entry point (qa-agent command)
│   ├── config.py                      # Tool sets, turn limits, agent names
│   ├── models.py                      # Model profile loader and resolver
│   ├── models.yaml                    # Model configuration (edit this!)
│   ├── runner.py                      # Execution engine
│   ├── agents/
│   │   ├── test_case_generator.py
│   │   ├── requirements_analyst.py
│   │   ├── bug_pattern_analyst.py
│   │   ├── regression_optimizer.py
│   │   ├── ai_test_architect.py
│   │   ├── synthetic_data_designer.py
│   │   ├── test_manager.py            # Orchestrator
│   │   ├── test_oracle_creator.py
│   │   ├── test_results_analyst.py
│   │   └── testware_creator.py
│   └── templates/
│       └── *.yaml                     # 5 prompt templates per agent (50 total)
└── examples/
    ├── run_single_agent.py
    ├── run_orchestrator.py
    └── sample_pbi.md                  # Sample input for testing
```

---

## License

MIT
