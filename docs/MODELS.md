# Model Configuration

All model configuration lives in a single file: `qa_ecosystem/models.yaml`.

---

## Providers

| Provider | Description |
|----------|-------------|
| `copilot` | GitHub Copilot SDK (Agent mode) -- GPT-4o, Claude Sonnet, o3-mini, Gemini |
| `anthropic-api` | Direct Anthropic API -- works everywhere, no CLI needed |
| `claude` | Anthropic Claude via Claude Agent SDK (backward compatibility) |
| `openai` | OpenAI GPT models via the OpenAI SDK |
| `openai-compatible` | Any OpenAI-compatible server -- Ollama, LM Studio, vLLM, Together, Groq |

---

## Role Mapping

The `roles` section in `models.yaml` maps logical roles to model profiles. Every agent uses the `default` role unless overridden by the role mapping or a CLI flag.

```yaml
roles:
  default: claude-sonnet-api       # planning subagents
  orchestrator: claude-opus-api    # test-manager
  playwright: copilot-gpt4o       # Playwright execution agents
  analysis: copilot-o3-mini        # analysis agents (coverage, hygiene, security)
```

---

## Pre-configured Model Profiles

| Profile | Provider | Model | Notes |
|---------|----------|-------|-------|
| `copilot-gpt4o` | GitHub Copilot | GPT-4o | |
| `copilot-o3-mini` | GitHub Copilot | o3-mini | |
| `copilot-gemini` | GitHub Copilot | Gemini 2.5 Pro | |
| `copilot-claude-haiku` | GitHub Copilot | Claude Haiku 4.5 | Fast & cost-efficient via Copilot |
| `claude-sonnet-api` | Anthropic API | claude-sonnet-4-5 | **Default** -- no CLI needed |
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

---

## Environment Variables

| Provider | Env Variable | How to Set |
|----------|-------------|------------|
| copilot | (automatic) | `gh auth login` |
| anthropic-api | `ANTHROPIC_API_KEY` | `export ANTHROPIC_API_KEY=sk-ant-...` |
| claude | `ANTHROPIC_API_KEY` | `export ANTHROPIC_API_KEY=sk-ant-...` |
| openai | `OPENAI_API_KEY` | `export OPENAI_API_KEY=sk-...` |
| ollama | `OLLAMA_API_KEY` | Set to any value (Ollama ignores keys) |

You can also override the config file location:

```bash
export QA_MODELS_CONFIG=/path/to/custom/models.yaml
```

---

## Using a Different Model Per Run

```bash
# Single agent with model override
qa-agent run test-case-generator --input examples/sample_pbi.md --model copilot-claude-haiku
qa-agent run bug-pattern-analyst --input bugs.csv --model gpt-4o
qa-agent run requirements-analyst --input story.md --model ollama-llama3
qa-agent run ui-test-designer --input spec.md --model copilot-gpt4o

# Workflow with model override (all agents in the workflow use this model)
qa-agent workflow feature-testing -i requirements.md -m copilot-claude-haiku
qa-agent workflow pbi-to-report -i pbi.md -m copilot-gpt4o
qa-agent workflow exploratory-testing -i "https://demoqa.com" -m copilot-claude-haiku
```

---

## Adding a Custom Model Profile

Add a new entry under `profiles:` in `models.yaml`:

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

Then use it from the CLI:

```bash
qa-agent run test-case-generator --input examples/sample_pbi.md --model my-local-mistral
```
