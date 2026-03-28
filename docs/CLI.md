# CLI Reference

The `qa-agent` CLI provides 13 subcommands covering discovery, execution, orchestration, workflow management, and Playwright workflows.

**Common flags:**
- `--input / -i` -- path to a file OR inline text (required for `run` and `orchestrate`)
- `--template / -t` -- template name (default: `default`)
- `--model / -m` -- model profile from `models.yaml`

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

# List all predefined workflows
qa-agent list-workflows
```

---

## Run a Single Agent

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

---

## Orchestrate (Test Manager Delegates to Agents)

```bash
# Full orchestration -- Test Manager decomposes and delegates
qa-agent orchestrate -i project_context.md

# Use a predefined DAG workflow
qa-agent orchestrate -i requirements.md --workflow feature-testing

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
# List and manage checkpoints
qa-agent list-checkpoints
qa-agent clean-checkpoints --keep 10
```

---

## Playwright Commands

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

## Diagnostics

```bash
# Run the diagnostic command
qa-agent doctor

# Verbose mode for debugging
qa-agent run <agent> --input <file> --verbose

# Capture structured logs
qa-agent run <agent> --input <file> --log-file debug.log
```
