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
     ┌──────┴──┐ ┌─────┴────┐ ┌───┴────┐ ┌────┴───┐ ┌───┴─────┐
     │Synthetic│ │  Test    │ │ Test   │ │Testware│ │         │
     │  Data   │ │ Oracle   │ │Results │ │Creator │ │         │
     │Designer │ │ Creator  │ │Analyst │ │        │ │         │
     └─────────┘ └──────────┘ └────────┘ └────────┘ └─────────┘
```

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/paveltspavlov/QA-Agent-Ecosystem.git
cd QA-Agent-Ecosystem

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Linux/macOS

# Install dependencies
pip install setuptools
pip install -e .

# For OpenAI / local model support:
pip install -e ".[openai]"

# Install the Anthropic SDK (for direct API access — no Claude Code CLI needed)
pip install anthropic

# Set your Anthropic API key
set ANTHROPIC_API_KEY=sk-ant-...       # Windows CMD
$env:ANTHROPIC_API_KEY="sk-ant-..."   # Windows PowerShell
export ANTHROPIC_API_KEY=sk-ant-...   # Linux/macOS

# Run an agent
qa-agent run test-case-generator --input examples/sample_pbi.md

# Run the full orchestrator
qa-agent orchestrate --input examples/sample_pbi.md
```

---

## User Guide

### Setup

```bash
# Install the package (editable mode for development)
pip install setuptools
pip install -e .

# Install Anthropic SDK for direct API access (recommended — no Claude Code CLI required)
pip install anthropic

# If you want OpenAI / local model support too:
pip install -e ".[openai]"
```

Set your API key(s) depending on which provider you'll use:

```bash
# For Anthropic Claude (direct API — recommended default)
set ANTHROPIC_API_KEY=sk-ant-...       # Windows CMD
$env:ANTHROPIC_API_KEY="sk-ant-..."   # Windows PowerShell
export ANTHROPIC_API_KEY=sk-ant-...   # Linux/macOS

# For OpenAI (optional)
set OPENAI_API_KEY=sk-...

# For Ollama — no key needed
```

> **Note:** Get your Anthropic API key from [console.anthropic.com](https://console.anthropic.com) — you need API credits (not a Claude.ai subscription).

---

### CLI Commands

#### 1. Explore What's Available

```bash
# See all 10 agents
qa-agent list-agents

# See all model profiles (Claude API, GPT, Ollama, LM Studio, etc.)
qa-agent list-models

# See prompt templates for a specific agent
qa-agent list-templates --agent test-case-generator

# See ALL templates across all agents
qa-agent list-templates
```

#### 2. Run a Single Agent

```bash
# Basic — uses default model (claude-sonnet-api via direct Anthropic API)
qa-agent run test-case-generator --input examples/sample_pbi.md

# Use a specific template
qa-agent run test-case-generator --input examples/sample_pbi.md --template risk-based

# Override to GPT-4o
qa-agent run test-case-generator --input examples/sample_pbi.md --model gpt-4o

# Use Claude Haiku (faster, cheaper)
qa-agent run test-case-generator --input examples/sample_pbi.md --model claude-haiku-api

# Use a local Ollama model
qa-agent run test-case-generator --input examples/sample_pbi.md --model ollama-llama3

# Pass inline text instead of a file
qa-agent run requirements-analyst --input "As a user I want to reset my password"
```

#### 3. Run the Orchestrator (Test Manager Delegates to Subagents)

```bash
# Full orchestration — Test Manager produces a comprehensive QA plan
qa-agent orchestrate --input examples/sample_pbi.md

# Orchestrate with a local model
qa-agent orchestrate --input examples/sample_pbi.md --model ollama-deepseek
```

> **Note:** The `anthropic-api` provider (default) calls the Anthropic Messages API directly and does not require the Claude Code CLI to be installed. Tool use and subagent delegation are not available on this path — the orchestrator produces a detailed test plan. The `claude` provider (via Claude Agent SDK) supports full subagent delegation but requires Claude Code CLI and CLI credits.

#### 4. Run from Python Code

```python
import asyncio
from qa_ecosystem.runner import run_single_agent, run_orchestrator

# Single agent
result = asyncio.run(run_single_agent(
    agent_name="test-case-generator",
    prompt="Generate test cases for a login feature with MFA",
    model_override="claude-sonnet-api",  # optional
))

# Orchestrator
result = asyncio.run(run_orchestrator(
    prompt="Full QA strategy for a payment processing module",
    model_override="claude-opus-api",  # optional
))
```

Or use the ready-made example scripts:

```bash
python examples/run_single_agent.py
python examples/run_orchestrator.py
```

---

### Configure Models

Edit **`qa_ecosystem/models.yaml`** — this is the single source of truth for all model configuration.

#### Change Which Model All Agents Use by Default

```yaml
roles:
  default: claude-haiku-api    # use Haiku for all subagents (faster/cheaper)
  orchestrator: claude-opus-api
```

#### Add a New Local Model

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

#### Pre-configured Profiles

| Profile | Provider | Model | Notes |
|---------|----------|-------|-------|
| `claude-sonnet-api` | Anthropic API | claude-sonnet-4-5 | **Default** — no CLI needed |
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

#### Override Config Location

```bash
set QA_MODELS_CONFIG=C:\path\to\custom\models.yaml    # Windows
export QA_MODELS_CONFIG=/path/to/custom/models.yaml   # Linux/macOS
qa-agent list-models
```

---

### All 10 Agents at a Glance

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

### Provider Behavior

| Provider | Requires | Tool Use | Best For |
|----------|----------|----------|----------|
| `anthropic-api` | `ANTHROPIC_API_KEY` + API credits | No | **Recommended default** — works everywhere |
| `claude` | Claude Code CLI + CLI credits | Yes | Full subagent orchestration |
| `openai` | `OPENAI_API_KEY` | No | GPT-based analysis |
| `openai-compatible` | Depends on service | No | Local/offline experimentation |

- **`anthropic-api`** calls the Anthropic Messages API directly using the `anthropic` Python SDK. No Claude Code CLI installation required. This is the recommended provider for most users.
- **`claude`** runs through the Claude Agent SDK, which spawns a Claude Code CLI subprocess. Supports full tool use and subagent delegation. Requires the Claude Code CLI and separate CLI credits.
- **OpenAI / OpenAI-compatible** uses the OpenAI Chat Completions API. Streamed responses, no tool use.

---

## Project Structure

```
QA-Agent-Ecosystem/
├── pyproject.toml                     # Package config and dependencies
├── requirements.txt                   # Pip fallback
├── README.md                          # This file
├── qa_ecosystem/
│   ├── __init__.py                    # Package init
│   ├── cli.py                         # CLI entry point (qa-agent command)
│   ├── config.py                      # Tool sets, turn limits, agent names
│   ├── models.py                      # Model profile loader and resolver
│   ├── models.yaml                    # Model configuration (edit this!)
│   ├── runner.py                      # Execution engine (Anthropic API + OpenAI)
│   ├── agents/
│   │   ├── __init__.py                # Agent registry
│   │   ├── test_case_generator.py     # Agent 1
│   │   ├── requirements_analyst.py    # Agent 2
│   │   ├── bug_pattern_analyst.py     # Agent 3
│   │   ├── regression_optimizer.py    # Agent 4
│   │   ├── ai_test_architect.py       # Agent 5
│   │   ├── synthetic_data_designer.py # Agent 6
│   │   ├── test_manager.py            # Agent 7 (Orchestrator)
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

---

## License

MIT
