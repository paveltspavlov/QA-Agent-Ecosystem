# QA Agent Ecosystem — Shared Skills System

The **skills system** allows reusable prompt fragments to be shared across multiple agents. Instead of copy-pasting instructions into every agent, common rules and patterns are defined once in `qa_ecosystem/skills/` and automatically injected into the relevant agents at load time.

## How It Works

1. Each skill is a plain markdown file in `qa_ecosystem/skills/`
2. Each agent declares which skills it needs via a `SKILLS = [...]` list
3. `build_prompt(base_prompt, skills=SKILLS)` assembles the final system prompt at import time
4. Skills are appended after the agent's unique base instructions, separated by `---`

## Available Skills

| Skill | Used By | What It Defines |
|-------|---------|-----------------|
| `playwright_selector_strategy` | playwright-test-generator, ui-test-designer, api-coverage-planner, pr-hygiene-checker, flake-triage | Selector priority: getByRole > getByTestId > CSS. Never XPath. |
| `playwright_waiting_strategy` | playwright-test-generator, ui-test-designer, pr-hygiene-checker, flake-triage | Never use hardcoded waits. Use Playwright auto-wait. |
| `page_object_model` | playwright-test-generator, ui-test-designer, seed-data-manager | POM architecture: page classes, fluent chaining, encapsulated locators |
| `test_data_factory` | playwright-test-generator, api-coverage-planner, seed-data-manager | Factory functions, faker-based data, override support, teardown helpers |
| `auth_state_caching` | ui-test-designer, seed-data-manager | storageState caching, per-role auth files, global setup pattern |
| `istqb_techniques` | test-case-generator, regression-optimizer, ai-test-architect | EP, BVA, decision tables, state transition testing |
| `priority_ranking` | test-case-generator, requirements-analyst, regression-optimizer, ai-test-architect, test-results-analyst, coverage-hunter, test-manager | P0–P3 framework |
| `severity_classification` | bug-pattern-analyst, security-scout, test-results-analyst, test-manager, accessibility-auditor, performance-profiler, api-contract-validator | CRITICAL / HIGH / MEDIUM / LOW definitions |
| `output_format_guidelines` | Most planning and execution agents, accessibility-auditor, performance-profiler, api-contract-validator | Markdown tables, code blocks, summary + recommendations structure |
| `bug_report_format` | bug-pattern-analyst, testware-creator | Standard bug report fields: Title, Environment, Steps, Expected, Actual, Severity |

## Listing Skills from the CLI

```bash
qa-agent list-skills
```

## Adding a New Skill

1. Create `qa_ecosystem/skills/your_skill_name.md`
2. Write the reusable prompt fragment in plain markdown
3. In any agent file, add `"your_skill_name"` to its `SKILLS` list
4. The skill is automatically injected next time the agent runs

## Modifying an Existing Skill

Edit the `.md` file directly in `qa_ecosystem/skills/`. The change applies to **all agents** that include that skill — no need to update individual agent files.

## Example Agent Definition

```python
from qa_ecosystem.skill_loader import build_prompt

_BASE_PROMPT = """
You are an expert Playwright automation engineer...
(agent-specific instructions only here)
"""

SKILLS = [
    "playwright_selector_strategy",   # shared selector hierarchy
    "playwright_waiting_strategy",    # shared no-hardcoded-waits rule
    "page_object_model",              # shared POM architecture
]

SYSTEM_PROMPT = build_prompt(_BASE_PROMPT, skills=SKILLS)
```
