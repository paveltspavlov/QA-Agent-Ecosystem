# Config Precedence

The QA Agent Ecosystem reads model configuration from four places. When they
disagree, this is the order from highest to lowest priority.

| # | Source | Scope | Example |
|---|--------|-------|---------|
| 1 | `-m / --model` flag on a single command | One command | `qa-agent run test-case-generator -m copilot-claude-sonnet` |
| 2 | `--role ROLE=PROFILE` flag at the root | One command, all matching roles | `qa-agent --role default=copilot-claude-sonnet run …` |
| 3 | `roles:` block in `qa_ecosystem/models.yaml` | Project-wide | `default: copilot-claude-haiku` |
| 4 | Hard-coded fallback (`copilot-claude-haiku`) | Used only when `models.yaml` is missing | — |

Profiles themselves (provider, model id, temperature, max tokens, base URL,
API-key env var) only come from `models.yaml`. Override `models.yaml`'s
location by setting `QA_MODELS_CONFIG=/path/to/your.yaml`.

## How a single command resolves

1. The CLI parses `--role` flags first and applies them as runtime overrides.
2. Each agent has a logical role (`default`, `orchestrator`, `playwright`,
   `playwright-copilot`, `analysis`).
3. When the agent runs, `resolve_model(cli_override=args.model,
   agent_role=<role>)` picks the profile:
   - if `-m PROFILE` was passed → use that profile.
   - else if `--role <agent_role>=PROFILE` was passed → use that profile.
   - else if `models.yaml` maps that role → use the mapped profile.
   - else fall back to the `default` role.

## API keys and `.env`

API keys are resolved from environment variables (`ANTHROPIC_API_KEY`,
`OPENAI_API_KEY`, etc.) or, when nothing is set, from any `api_key_default`
declared on the profile. `qa-agent setup` creates a `.env` that's loaded
automatically on import.

If the resolved profile requires a key that isn't set, the runner prints a
short hint pointing at `qa-agent setup` instead of a stack trace.

## Examples

```bash
# Use the project-wide default (copilot-claude-haiku)
qa-agent run test-case-generator -i pbi.md

# Override the default for one command
qa-agent run test-case-generator -i pbi.md -m copilot-claude-sonnet

# Override default and orchestrator for one full workflow
qa-agent --role default=copilot-claude-sonnet --role orchestrator=claude-opus-api \
  workflow feature-testing -i requirements.md

# Permanent change — edit models.yaml's roles block
# roles:
#   default: copilot-claude-sonnet
```

## See also

- [docs/MODELS.md](MODELS.md) — full profile reference.
- `qa_ecosystem/models.yaml` — where profiles and the role mapping live.
- `qa-agent doctor` — checks that the resolved default profile has the keys it needs.
