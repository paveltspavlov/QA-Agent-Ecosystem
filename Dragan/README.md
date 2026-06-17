# GitHub Copilot QA Agents

GitHub Copilot custom-agent translations of the QA Agent Ecosystem
(`qa_ecosystem/agents/*.py`). Each `*.agent.md` file is a self-contained agent usable
from VS Code Copilot Chat (select the agent in the chat agent picker), the Copilot CLI
(`copilot --agent <name>`), or the Copilot coding agent.

## How it works

```
.vscode/current_task/
├── requirements.md         ← YOU write the task here (always the entry point)
├── clarifications.md       ← agents write questions; YOU fill in the answers
├── plan.md                 ← qa-manager's approved execution plan
├── NN-<agent-name>.md      ← one traceability file per executed step
└── final-report.md         ← qa-manager's consolidated result
```

1. Describe the task in `.vscode/current_task/requirements.md`.
2. Invoke the **qa-manager** agent. It picks (or composes) a workflow from its catalog,
   writes `plan.md`, and asks you to approve it.
3. Each step runs under one specialized agent and saves its full output — inputs used,
   assumptions, work performed, deliverable, files touched — to `NN-<agent>.md`, so any
   reasoning error or hallucination in the final result can be traced to its source step.
4. If any agent hits an ambiguity that needs a human/business decision, it appends a
   question to `clarifications.md` and the workflow **stops**. Fill in the `Answer:`
   fields and re-invoke qa-manager — it resumes from where it stopped and continues
   until the task is complete.

Agents can also be invoked standalone (without qa-manager); they then read
`requirements.md` directly and write their results as step `00`.

## Workflows

The workflow catalog (26 workflows) lives in [`qa-manager.agent.md`](qa-manager.agent.md),
including a template and rules for adding your own.

## Regenerating

The specialist agent files are generated from the Python definitions:

```bash
python scripts/generate_copilot_agents.py
```

`qa-manager.agent.md` and this README are maintained by hand — the generator skips them.
If you edit an agent's prompt, edit the Python source in `qa_ecosystem/agents/` and
regenerate, so the CLI ecosystem and the Copilot agents stay in sync. Shared skills are
referenced, not inlined: agents read `qa_ecosystem/skills/*.md` at runtime, so skill
edits apply to both worlds immediately.

Every generated agent also carries a shared **Output discipline (token budget)** section
— scope tightly, decision-first, structured + bounded output, no unsolicited extras,
assume-don't-ask. It is injected uniformly by the generator (`OUTPUT_DISCIPLINE` in
`generate_copilot_agents.py`), so edit it there once to change all agents rather than
per-file. `qa-manager.agent.md` carries its own **Token & scope discipline** rules by hand.
