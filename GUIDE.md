# QA Agent Ecosystem — User Guide

A toolkit of 21 specialized AI-powered QA agents (10 planning + 11 execution) orchestrated by a Test Manager, with DAG-based workflow engine, multi-provider model support, and comprehensive test suite.

---

## Table of Contents

- [Setup](#setup)
- [CLI Commands](#cli-commands)
  - [Explore What's Available](#1-explore-whats-available)
  - [Run a Single Agent](#2-run-a-single-agent)
  - [Run the Orchestrator](#3-run-the-orchestrator-test-manager-delegates-to-subagents)
  - [Run from Python Code](#4-run-from-python-code)
- [Configure Models](#configure-models)
  - [Change Default Models](#change-which-model-all-agents-use-by-default)
  - [Add a New Local Model](#add-a-new-local-model)
  - [Override Config Location](#override-config-location)
- [Agent Reference](#all-10-agents-at-a-glance)
- [Provider Behavior](#provider-behavior)

---

## Setup

```bash
cd C:\Users\LEGION\Downloads\QA_app

# Install the package (editable mode)
pip install -e .

# If you want OpenAI / local model support too:
pip install -e ".[openai]"
```

Set your API key(s) depending on which provider you'll use:

```bash
# For Claude (required for Agent SDK path)
set ANTHROPIC_API_KEY=sk-ant-...

# For OpenAI (optional)
set OPENAI_API_KEY=sk-...

# For Ollama — no key needed, it's ignored
```

---

## CLI Commands

### 1. Explore What's Available

```bash
# See all 21 agents
qa-agent list-agents

# See all model profiles (Claude, GPT, Ollama, LM Studio, etc.)
qa-agent list-models

# See prompt templates for a specific agent
qa-agent list-templates --agent test-case-generator

# See ALL templates across all agents
qa-agent list-templates

# See all predefined DAG workflows
qa-agent list-workflows

# Manage checkpoints
qa-agent list-checkpoints
qa-agent clean-checkpoints --keep 10
```

### 2. Run a Single Agent

```bash
# Basic — uses default model (claude-sonnet)
qa-agent run test-case-generator --input examples/sample_pbi.md

# Use a specific template
qa-agent run test-case-generator --input examples/sample_pbi.md --template risk-based

# Override the model to GPT-4o
qa-agent run test-case-generator --input examples/sample_pbi.md --model gpt-4o

# Use a local Ollama model
qa-agent run test-case-generator --input examples/sample_pbi.md --model ollama-llama3

# Pass inline text instead of a file
qa-agent run requirements-analyst --input "As a user I want to reset my password"
```

### 3. Run the Orchestrator (Test Manager Delegates to Subagents)

```bash
# Full orchestration — Test Manager assigns work to specialist agents
qa-agent orchestrate --input examples/sample_pbi.md

# End-to-end example: requirements -> test execution -> bug report
qa-agent orchestrate --input examples/workflow_requirements_to_report.md

# Use a predefined DAG workflow with dependency-aware execution
qa-agent orchestrate --input requirements.md --workflow feature-testing

# Use a custom workflow YAML file
qa-agent orchestrate --input requirements.md --workflow-file custom.yaml

# Customize agent ordering and dependencies
qa-agent orchestrate --input requirements.md --workflow feature-testing \
  --reorder "1:test-case-generator, 2:requirements-analyst" --deps "2:[1]"

# Skip specific agents
qa-agent orchestrate --input requirements.md --workflow feature-testing \
  --skip synthetic-data-designer

# Webhook notification on completion
qa-agent orchestrate --input requirements.md --workflow feature-testing \
  --notify https://hooks.slack.com/services/T00/B00/xxx

# Orchestrate with a local model (plan-only, no subagent delegation)
qa-agent orchestrate --input examples/sample_pbi.md --model ollama-deepseek
```

> **Plan approval:** When using the `copilot` or `claude` provider, the Test Manager
> presents its proposed agent sequence for your review before delegation begins. You can
> approve, edit (reorder/add/remove agents), or reject the plan.

> **Note:** Only the `copilot` and `claude` providers support tool use and subagent delegation.
> When you use OpenAI or local models, the orchestrator produces a test plan but
> cannot actually invoke the specialist agents.

### 4. Run from Python Code

```python
import asyncio
from qa_ecosystem.runner import run_single_agent, run_orchestrator

# Single agent
result = asyncio.run(run_single_agent(
    agent_name="test-case-generator",
    prompt="Generate test cases for a login feature with MFA",
    model_override="gpt-4o",  # optional
))

# Orchestrator
result = asyncio.run(run_orchestrator(
    prompt="Full QA strategy for a payment processing module",
    model_override="claude-opus",  # optional
))
```

Or use the ready-made example scripts:

```bash
python examples/run_single_agent.py
python examples/run_orchestrator.py
```

---

## Configure Models

Edit **`qa_ecosystem/models.yaml`** — this is the single source of truth for all model configuration.

### Change Which Model All Agents Use by Default

```yaml
roles:
  default: gpt-4o              # all subagents use GPT-4o
  orchestrator: claude-opus    # test-manager stays on Claude
```

### Add a New Local Model

Add a new profile under `profiles:` in `models.yaml`:

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

Then use it:

```bash
qa-agent run bug-pattern-analyst -i bugs.csv --model my-local-mistral
```

### Pre-configured Profiles

The following profiles are included out of the box in `models.yaml`:

| Profile | Provider | Model |
|---------|----------|-------|
| `claude-sonnet` | Anthropic Claude | Latest Sonnet |
| `claude-opus` | Anthropic Claude | Latest Opus |
| `claude-haiku` | Anthropic Claude | Latest Haiku |
| `gpt-4o` | OpenAI | GPT-4o |
| `gpt-4o-mini` | OpenAI | GPT-4o Mini |
| `ollama-llama3` | Ollama (local) | Llama 3.1 |
| `ollama-qwen` | Ollama (local) | Qwen 2.5 |
| `ollama-deepseek` | Ollama (local) | DeepSeek R1 |
| `lmstudio` | LM Studio (local) | Default loaded model |
| `vllm-local` | vLLM (local) | Default served model |
| `together-llama` | Together AI | Llama 3.1 70B |
| `groq-llama` | Groq | Llama 3.3 70B |

### Override Config Location

Point to a custom config file via environment variable:

```bash
set QA_MODELS_CONFIG=C:\path\to\custom\models.yaml
qa-agent list-models
```

---

## All 21 Agents at a Glance

### Planning Agents (10)

| Agent | What It Does | Example Use |
|-------|-------------|-------------|
| `test-case-generator` | ISTQB test cases from requirements | `qa-agent run test-case-generator -i pbi.md` |
| `requirements-analyst` | Finds ambiguities in PBIs | `qa-agent run requirements-analyst -i story.md` |
| `bug-pattern-analyst` | Patterns and trends from bug reports | `qa-agent run bug-pattern-analyst -i bugs.csv` |
| `regression-optimizer` | Optimized regression suites | `qa-agent run regression-optimizer -i tests.csv` |
| `ai-test-architect` | AI/ML test strategy and compliance | `qa-agent run ai-test-architect -i ai_project.md` |
| `synthetic-data-designer` | Privacy-safe test data | `qa-agent run synthetic-data-designer -i spec.md` |
| `test-manager` | **Orchestrator** — delegates to all others | `qa-agent orchestrate -i project.md` |
| `test-oracle-creator` | Expected results and validation rules | `qa-agent run test-oracle-creator -i scenarios.md` |
| `test-results-analyst` | Failure trends from execution data | `qa-agent run test-results-analyst -i results.csv` |
| `testware-creator` | Test plans, reports, matrices | `qa-agent run testware-creator -i scope.md` |

### Execution Agents (11)

| Agent | What It Does | Example Use |
|-------|-------------|-------------|
| `playwright-test-generator` | Generate Playwright TypeScript tests | `qa-agent playwright-gen --url https://myapp.com` |
| `ui-test-designer` | POM-based UI tests, accessibility selectors | `qa-agent run ui-test-designer -i spec.md` |
| `api-coverage-planner` | API test coverage matrix | `qa-agent run api-coverage-planner -i openapi.yaml` |
| `pr-hygiene-checker` | 8-check code quality gate | `qa-agent playwright-analyze --agent pr-hygiene-checker -i tests/` |
| `security-scout` | Secrets and vulnerability scanning | `qa-agent playwright-analyze --agent security-scout -i .` |
| `coverage-hunter` | Test coverage gap analysis | `qa-agent run coverage-hunter -i tests/` |
| `flake-triage` | Flaky test diagnosis and fix | `qa-agent run flake-triage -i tests/` |
| `seed-data-manager` | Test data factories and fixtures | `qa-agent run seed-data-manager -i spec.md` |
| `accessibility-auditor` | WCAG 2.1 AA compliance via axe-core | `qa-agent run accessibility-auditor -i "https://myapp.com"` |
| `performance-profiler` | Core Web Vitals and load profiling | `qa-agent run performance-profiler -i "https://myapp.com"` |
| `api-contract-validator` | OpenAPI spec validation, breaking changes | `qa-agent run api-contract-validator -i openapi.yaml` |

Each agent has **5 prompt templates**. View them with:

```bash
qa-agent list-templates --agent <agent-name>
```

---

## Provider Behavior

| Provider | Tool Use | Subagent Delegation | Permission Approval | Best For |
|----------|----------|-------------------|---------------------|----------|
| `copilot` | Yes | Yes | Interactive (per-action or approve-all) | Full orchestration, Playwright agents |
| `claude` | Yes | Yes | `acceptEdits` (auto) | Full orchestration, production workflows |
| `anthropic-api` | No | No | N/A | Direct API access, no CLI needed |
| `openai` | No | No | N/A | Cost-effective drafting, GPT-based analysis |
| `openai-compatible` | No | No | N/A | Local experimentation, privacy, offline use |

- **Copilot** runs through the GitHub Copilot SDK with full tool access and subagent delegation. Every tool action (shell commands, file writes, URL fetches) prompts the user for approval. You can approve one-by-one, or type `a` / `all` to approve all remaining actions in the session.
- **Claude** runs through the Claude Agent SDK with full access to file tools (Read, Write, Edit, Grep, Glob, Bash) and the Agent tool for subagent delegation.
- **Anthropic API** calls the Anthropic Messages API directly. No CLI or external tools needed -- just set `ANTHROPIC_API_KEY`.
- **OpenAI / OpenAI-compatible** runs via the OpenAI Chat Completions API. The agent's system prompt is sent as a system message and the user prompt as a user message. Responses are streamed. No tool use or file access is available on this path.

---

## Project Structure

```
QA_app/
├── pyproject.toml                     # Package config and dependencies
├── requirements.txt                   # Pip fallback
├── GUIDE.md                           # This file
├── qa_ecosystem/
│   ├── __init__.py                    # Package init
│   ├── cli.py                         # CLI entry point (13 subcommands)
│   ├── config.py                      # Tool sets, turn limits, agent names
│   ├── models.py                      # Model profile loader and resolver
│   ├── models.yaml                    # Model configuration (edit this!)
│   ├── runner.py                      # Thin orchestration layer
│   ├── workflow_executor.py           # DAG-based workflow engine
│   ├── workflows.yaml                 # 13 predefined workflow definitions
│   ├── checkpoint.py                  # Session persistence with per-step status
│   ├── metrics.py                     # Token usage and cost tracking
│   ├── notifications.py              # Webhook notifications (Slack support)
│   ├── sdk_adapter.py                # AgentDefinition + AgentResult dataclasses
│   ├── providers/                     # Provider modules
│   │   ├── copilot.py                # GitHub Copilot SDK path
│   │   ├── claude.py                 # Claude Agent SDK path
│   │   ├── anthropic_api.py          # Anthropic Messages API path
│   │   └── openai.py                 # OpenAI/compatible path
│   ├── agents/                        # 21 agent definitions
│   │   ├── __init__.py               # Agent registry
│   │   ├── test_case_generator.py    ... test_manager.py (10 planning)
│   │   ├── playwright_test_generator.py ... seed_data_manager.py (8 execution)
│   │   ├── accessibility_auditor.py  # WCAG 2.1 AA audits
│   │   ├── performance_profiler.py   # Core Web Vitals profiling
│   │   └── api_contract_validator.py # OpenAPI spec validation
│   └── templates/
│       ├── __init__.py               # Template loader
│       └── *.yaml                    # 5 templates per agent (105 total)
├── tests/                             # 175 pytest tests
│   ├── test_agents.py                # Agent registry tests
│   ├── test_cli.py                   # CLI argument parsing tests
│   ├── test_workflow_executor.py     # Workflow DAG execution tests
│   └── ...                           # checkpoint, notifications, skills, templates
└── examples/
    ├── run_single_agent.py           # Programmatic single-agent example
    ├── run_orchestrator.py           # Programmatic orchestrator example
    └── sample_pbi.md                 # Sample PBI for testing
```
