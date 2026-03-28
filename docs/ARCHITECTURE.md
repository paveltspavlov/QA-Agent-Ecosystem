# Architecture

## System Overview

21 AI-powered QA agents (10 planning + 11 Playwright execution) with multi-provider model support, orchestrated by a Test Manager. Built on the GitHub Copilot SDK (Agent mode) as the primary provider, with backward compatibility for direct Anthropic API access, Claude Agent SDK, OpenAI, and local models.

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
     accessibility-auditor       performance-profiler
     api-contract-validator
```

---

## Project Structure

```
qa_ecosystem/
├── agents/               # 21 agent definitions (10 planning + 11 execution)
├── templates/            # 21 YAML files with 105 prompt templates
├── providers/            # Provider modules (copilot, claude, anthropic_api, openai)
├── sdk_adapter.py        # AgentDefinition + AgentResult dataclasses
├── runner.py             # Thin orchestration layer delegating to providers
├── workflow_executor.py  # DAG-based workflow engine with parallel execution
├── workflows.yaml        # 12 predefined workflow definitions
├── checkpoint.py         # Session persistence with per-step status tracking
├── metrics.py            # Token usage and cost tracking
├── notifications.py      # Webhook notifications (Slack Block Kit support)
├── models.py             # Model profile abstraction and resolver
├── models.yaml           # Model configuration (all providers)
├── config.py             # Tool sets, agent registry, constants
├── cli.py                # CLI entry point with 13 subcommands
└── __init__.py
tests/                    # 175 pytest tests
├── test_agents.py        # Agent registry and definition tests
├── test_cli.py           # CLI argument parsing tests
├── test_checkpoint.py    # Checkpoint persistence tests
├── test_notifications.py # Webhook notification tests
├── test_skill_loader.py  # Skill loading tests
├── test_templates.py     # Template YAML parsing tests
└── test_workflow_executor.py  # Workflow DAG execution tests
playwright/               # Playwright TypeScript framework scaffold
├── playwright.config.ts
├── pages/                # Page Object Model classes
├── fixtures/             # Custom test fixtures
├── helpers/              # Timeouts, env, API helpers
├── test-data/            # Data factory
├── auth/                 # Auth state caching
└── tests/                # UI and API test specs
docs/
├── QA_CONTEXT.md         # Playwright conventions and patterns
├── PROMPT_LIBRARY.md     # Copy-paste prompts for all 21 agents
├── SKILLS.md             # Skills system documentation
├── TROUBLESHOOTING.md    # Common errors and fixes
├── ARCHITECTURE.md       # This file
├── AGENTS.md             # Agent reference
├── WORKFLOWS.md          # Workflow definitions
├── MODELS.md             # Model configuration
└── CLI.md                # CLI reference
outputs/              # Auto-created on first run
├── manager_instructions.md   # Test Manager delegation plans
└── {agent-name}/             # One folder per agent
    └── YYYY-MM-DD_HH-MM-SS.md  # Timestamped result files
```

---

## Key Concepts

### Dual-Prompt Architecture

Each agent has two prompt layers:

1. **System prompt** — hardcoded `_BASE_PROMPT` in the agent `.py` file + shared skills appended via `build_prompt()`. Defines the agent's role and behavior.
2. **User/task prompt** — filled from YAML templates in `qa_ecosystem/templates/` via `fill_template()`. Provides the specific task context.

### SDK Adapter Layer

The `AgentDefinition` dataclass provides a provider-agnostic agent contract:

- `description` — agent purpose
- `prompt` — system prompt
- `tools` — tool set from `config.py`
- `model` — default model profile
- `category` — `planning` or `execution`
- `output_schema` (optional) — JSON schema for structured output validation

### Structured Result Contracts

`AgentResult` dataclass with `status`, `summary`, `artifacts`, and `metadata` for typed inter-agent communication.

### DAG Workflow Engine

`workflow_executor.py` executes workflows defined in `workflows.yaml` with:
- Index-based step ordering
- Dependency management (steps can depend on earlier steps)
- Parallel execution via `asyncio.gather()` for independent steps

---

## Provider Behavior

| Provider | Tool Use | Subagent Delegation | Permission Approval | Best For |
|----------|----------|---------------------|---------------------|----------|
| `copilot` | Yes | Yes | Interactive (per-action or approve-all) | Full orchestration, Playwright agents, multi-model |
| `anthropic-api` | No | No | N/A | **Recommended** -- works everywhere, no CLI needed |
| `claude` | Yes | Yes | `acceptEdits` (auto) | Full orchestration, backward compatibility |
| `openai` | No | No | N/A | Cost-effective drafting, GPT-based analysis |
| `openai-compatible` | No | No | N/A | Local experimentation, privacy, offline use |

- **Copilot** runs through the GitHub Copilot SDK with full tool access and subagent delegation. Every tool action prompts the user for approval.
- **Anthropic API** calls the Anthropic Messages API directly. No CLI or external tools needed -- just set `ANTHROPIC_API_KEY`. Supports interactive Q&A.
- **Claude** runs through the Claude Agent SDK with full access to file tools and the Agent tool for subagent delegation.
- **OpenAI / OpenAI-compatible** runs via the OpenAI Chat Completions API. Supports interactive Q&A.

> **Note:** Full subagent delegation requires the `copilot` or `claude` provider. The `anthropic-api` and `openai` providers produce comprehensive QA plans but do not have tool access for live delegation.

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
└── ...
```

- Each agent gets its own subfolder under `outputs/`.
- Files are named by timestamp (`YYYY-MM-DD_HH-MM-SS.md`) so runs never overwrite each other.
- When running the orchestrator, the Test Manager's delegation plan is also appended to `outputs/manager_instructions.md`.

---

## Interactive Q&A

When using the `anthropic-api` or `openai` providers, agents support multi-turn conversation. If an agent needs clarification, it will pause and prompt you:

```
Agent is asking a question. Type your reply (or press Enter to skip):
> _
```

---

## Python API

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
