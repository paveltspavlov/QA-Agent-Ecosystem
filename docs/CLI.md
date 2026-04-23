# CLI Reference

The `qa-agent` CLI provides subcommands covering discovery, execution, orchestration, workflow management, and Playwright workflows.

**Common flags:**
- `--input / -i` -- path to a file OR inline text (required for `run`, `orchestrate`, `workflow`)
- `--template / -t` -- template name (default: `default`)
- `--model / -m` -- model profile from `models.yaml` (e.g. `copilot-claude-haiku`, `copilot-claude-sonnet`, `copilot-gpt4o`)

**Root-level flags** (placed BEFORE the subcommand):
- `--verbose / -v` -- full prompts, responses, and profile details
- `--log-file PATH` -- write structured JSON log entries to this file (default: `<session>/run.log`)
- `--role ROLE=PROFILE` -- override a role→profile mapping for this run (repeatable).
  Example: `qa-agent --role default=copilot-claude-sonnet --role orchestrator=claude-opus-api orchestrate -w feature-testing -i pbi.md`

---

## Discovery Commands

```bash
# List all 21 agents
qa-agent list-agents

# List all 105 prompt templates
qa-agent list-templates

# List templates for a specific agent
qa-agent list-templates --agent playwright-test-generator

# List all configured model profiles
qa-agent list-models

# List all shared skills
qa-agent list-skills

# List all predefined workflows (shows keys for use with `workflow` command)
qa-agent list-workflows
```

---

## Run a Single Agent

```bash
# Basic run with default model
qa-agent run test-case-generator -i requirements.md

# Use a specific template and model
qa-agent run test-case-generator -i requirements.md -t risk-based -m copilot-gpt4o

# Use the fast copilot-claude-haiku model
qa-agent run test-case-generator -i requirements.md -m copilot-claude-haiku

# Use a local model
qa-agent run test-case-generator -i requirements.md -m ollama-llama3

# Pass inline text instead of a file
qa-agent run requirements-analyst -i "As a user I want to reset my password"
```

---

## Run a Workflow (shorthand)

The `workflow` command is a shorthand for `orchestrate --workflow`. It runs a predefined DAG workflow from `workflows.yaml`.

```bash
# Run a workflow with a file input
qa-agent workflow feature-testing -i requirements.md

# Run with a URL (auto-detected for web-focused workflows)
qa-agent workflow exploratory-testing -i "https://demoqa.com"

# Use copilot-claude-haiku for fast, cost-efficient execution
qa-agent workflow pbi-to-report -i inputs/pbi-to-report.md -m copilot-claude-haiku

# Preview execution plan without running
qa-agent workflow feature-testing -i requirements.md --dry-run

# Skip specific agents
qa-agent workflow playwright-gen -i "https://myapp.com" --skip accessibility-auditor performance-profiler

# Resume from a checkpoint after a failure
qa-agent workflow pbi-to-report -i pbi.md --resume outputs/checkpoints/<session-id>.json

# Send a Slack notification on completion
qa-agent workflow full-qa-pipeline -i "https://myapp.com" --notify https://hooks.slack.com/services/T00/B00/xxx

# Multi-line input via heredoc
qa-agent workflow pbi-to-report -i - <<'EOF'
PBI: As a registered user, I want to reset my password via email link.
Acceptance criteria:
- Reset email sent within 30 seconds
- Link expires after 24 hours
App URL: https://demoqa.com
EOF
```

See the full [Workflow Guide](WORKFLOW_GUIDE.md) for all 16 workflows with input templates.

---

## Orchestrate (full form with advanced options)

```bash
# Full orchestration -- Test Manager decomposes and delegates
qa-agent orchestrate -i project_context.md

# Use a predefined DAG workflow (equivalent to `workflow` command)
qa-agent orchestrate -i requirements.md --workflow feature-testing -m copilot-claude-haiku

# Use a custom workflow YAML file
qa-agent orchestrate -i requirements.md --workflow-file custom.yaml

# Reorder agents and set custom dependencies
qa-agent orchestrate -i requirements.md --workflow feature-testing \
  --reorder "1:test-case-generator, 2:requirements-analyst, 3:testware-creator" \
  --deps "2:[1], 3:[1,2]"

# Skip specific agents
qa-agent orchestrate -i requirements.md --workflow feature-testing \
  --skip synthetic-data-designer test-oracle-creator

# Send a webhook notification on completion
qa-agent orchestrate -i requirements.md --workflow feature-testing \
  --notify https://hooks.slack.com/services/T00/B00/xxx
```

---

## Workflow Management

```bash
# List all predefined workflows with their keys
qa-agent list-workflows

# List and manage checkpoints
qa-agent list-checkpoints
qa-agent clean-checkpoints --keep 10

# Chain agents linearly (no DAG, simple pipe)
qa-agent chain requirements-analyst test-case-generator testware-creator -i requirements.md
```

---

## Sessions

All agent/workflow artifacts save under `outputs/{app_name}/{timestamp}/`. Each
session contains `agents/<agent>/result.{md,json}`, `bugs/`, `reports/`,
`metrics.json`, `manifest.json`, and `run.log`. A rollup line is appended to
`outputs/runs.jsonl` after every run.

```bash
# List all sessions under outputs/
qa-agent list-sessions

# Show artifacts (from manifest.json) and metrics for one session
qa-agent show-session latest
qa-agent show-session demoqa-com/2026-04-23_10-15-00
```

---

## Playwright Commands

```bash
# Generate Playwright tests from a URL
qa-agent playwright-gen --url https://myapp.com

# Generate with a specific agent and model
qa-agent playwright-gen --url https://myapp.com --agent ui-test-designer -m copilot-claude-haiku

# Run Playwright tests with optional analysis
qa-agent playwright-run --project chromium --analyze
qa-agent playwright-run --project api --reporter json

# Analyze existing test code
qa-agent playwright-analyze --agent pr-hygiene-checker -i playwright/tests/
qa-agent playwright-analyze --agent security-scout -i playwright/
qa-agent playwright-analyze --agent flake-triage -i playwright/tests/ui/login.spec.ts

# Generate test execution reports
qa-agent playwright-report --fast                          # deterministic, no LLM
qa-agent playwright-report -m copilot-claude-haiku         # LLM-enriched report
```

---

## Diagnostics

```bash
# Interactive setup wizard
qa-agent init

# Run the diagnostic command
qa-agent doctor

# Verbose mode for debugging
qa-agent --verbose workflow pbi-to-report -i pbi.md

# Capture structured logs
qa-agent --log-file debug.log workflow feature-testing -i requirements.md
```
