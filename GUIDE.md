# QA Agent Ecosystem — User Guide

A toolkit of 10 specialized AI-powered QA agents orchestrated by a Test Manager, built on the Claude Agent SDK with support for multiple AI providers.

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
# See all 10 agents
qa-agent list-agents

# See all model profiles (Claude, GPT, Ollama, LM Studio, etc.)
qa-agent list-models

# See prompt templates for a specific agent
qa-agent list-templates --agent test-case-generator

# See ALL templates across all agents
qa-agent list-templates
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

# Orchestrate with a local model (plan-only, no subagent delegation)
qa-agent orchestrate --input examples/sample_pbi.md --model ollama-deepseek
```

> **Note:** Only the `claude` provider supports tool use and subagent delegation.
> When you use OpenAI or local models, the orchestrator produces a test plan but
> cannot actually invoke the 9 specialist agents.

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

## All 10 Agents at a Glance

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

Each agent has **5 prompt templates**. View them with:

```bash
qa-agent list-templates --agent <agent-name>
```

---

## Provider Behavior

| Provider | Tool Use | Subagent Delegation | Best For |
|----------|----------|-------------------|----------|
| `claude` | Yes | Yes | Full orchestration, production workflows |
| `openai` | No | No | Cost-effective drafting, GPT-based analysis |
| `openai-compatible` | No | No | Local experimentation, privacy, offline use |

- **Claude** runs through the Claude Agent SDK with full access to file tools (Read, Write, Edit, Grep, Glob, Bash) and the Agent tool for subagent delegation.
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
│   ├── cli.py                         # CLI entry point (qa-agent command)
│   ├── config.py                      # Tool sets, turn limits, agent names
│   ├── models.py                      # Model profile loader and resolver
│   ├── models.yaml                    # Model configuration (edit this!)
│   ├── runner.py                      # Execution engine (Claude SDK + OpenAI)
│   ├── agents/
│   │   ├── __init__.py                # Agent registry
│   │   ├── test_case_generator.py     # Agent 1
│   │   ├── requirements_analyst.py    # Agent 2
│   │   ├── bug_pattern_analyst.py     # Agent 3
│   │   ├── regression_optimizer.py    # Agent 4
│   │   ├── ai_test_architect.py       # Agent 5
│   │   ├── synthetic_data_designer.py # Agent 6
│   │   ├── test_manager.py           # Agent 7 (Orchestrator)
│   │   ├── test_oracle_creator.py     # Agent 8
│   │   ├── test_results_analyst.py    # Agent 9
│   │   └── testware_creator.py        # Agent 10
│   └── templates/
│       ├── __init__.py                # Template loader
│       └── *.yaml                     # 5 prompt templates per agent (50 total)
└── examples/
    ├── run_single_agent.py            # Programmatic single-agent example
    ├── run_orchestrator.py            # Programmatic orchestrator example
    └── sample_pbi.md                  # Sample PBI for testing
```
