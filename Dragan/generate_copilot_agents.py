"""Generate GitHub Copilot custom agent files (Dragan/*.agent.md)
from the Python agent definitions in qa_ecosystem/agents/.

Run from the repo root:
    python Dragan/generate_copilot_agents.py

The orchestrator (test-manager) is NOT generated here -- it is maintained by
hand as Dragan/qa-manager.agent.md because it carries the workflow
catalog and the current-task protocol in full.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
AGENTS_DIR = REPO_ROOT / "qa_ecosystem" / "agents"
OUT_DIR = REPO_ROOT / "Dragan"

# Modules that are not generated from Python sources
SKIP_MODULES = {"__init__.py", "test_manager.py"}

# Map qa_ecosystem tool sets to GitHub Copilot agent tools
TOOL_MAP = {
    "read_only": ["search", "codebase"],
    "read_analyze": ["search", "codebase", "runCommands"],
    "read_write": ["search", "codebase", "editFiles"],
    "full": ["search", "codebase", "editFiles", "runCommands"],
    "playwright_full": ["search", "codebase", "editFiles", "runCommands"],
    "orchestrator": ["search", "codebase", "editFiles", "runCommands"],
}

# Every generated agent always needs to read/write .vscode/current_task/
ALWAYS_TOOLS = ["editFiles"]

ACRONYMS = {"ai": "AI", "api": "API", "pr": "PR", "ui": "UI", "qa": "QA"}

# Claude-runtime tool names -> Copilot-neutral phrasing (ordered; applied to
# prompt bodies and descriptions)
TOOL_NAME_SUBS = [
    (re.compile(r"Use Read and Grep"), "Use file reading and text search"),
    (re.compile(r"Grep for patterns, Read for details"),
     "text search for patterns, file reading for details"),
    (re.compile(r"\bBash tool\b"), "terminal"),
    (re.compile(r"\b(?:Write|Edit) tool\b"), "file editor"),
    (re.compile(r"\bGrep\b"), "text search"),
    (re.compile(r"\bGlob\b"), "file globbing"),
    (re.compile(r"\bBash\b"), "the terminal"),
]


def neutralize_tool_names(text: str) -> str:
    for pattern, repl in TOOL_NAME_SUBS:
        text = pattern.sub(repl, text)
    return text


def title_from_name(name: str) -> str:
    return " ".join(ACRONYMS.get(p, p.capitalize()) for p in name.split("-"))


def extract(module_path: Path) -> dict:
    src = module_path.read_text(encoding="utf-8")
    tree = ast.parse(src)
    data: dict = {"skills": []}
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign) and len(node.targets) == 1:
            target = node.targets[0]
            if not isinstance(target, ast.Name):
                continue
            if target.id == "AGENT_NAME" and isinstance(node.value, ast.Constant):
                data["name"] = node.value.value
            elif target.id == "DESCRIPTION" and isinstance(node.value, ast.Constant):
                data["description"] = node.value.value
            elif target.id == "_BASE_PROMPT" and isinstance(node.value, ast.Constant):
                data["prompt"] = node.value.value
            elif target.id == "SKILLS" and isinstance(node.value, ast.List):
                data["skills"] = [
                    e.value for e in node.value.elts if isinstance(e, ast.Constant)
                ]
    m = re.search(r'TOOL_SETS\["(\w+)"\]', src)
    data["tool_set"] = m.group(1) if m else "read_only"
    missing = {"name", "description", "prompt"} - data.keys()
    if missing:
        raise ValueError(f"{module_path.name}: missing {missing}")
    return data


# Uniform token-budget discipline injected into every generated agent.
# Keeps outputs scoped, structured, and short to minimise token consumption
# without weakening any agent's domain deliverable.
OUTPUT_DISCIPLINE = """\
## Output discipline (token budget)

You are billed per token. Keep every run lean:

- **Stay in scope.** Work only on the files, paths, and feature named in `requirements.md` (plus your dependency outputs). Do not explore the wider repo. Ignore docs, examples, generated, vendored, and unrelated failing tests unless they are the named target.
- **Decision first.** Lead with the verdict/result, then the minimum supporting detail. No preamble, no restating the task, no explaining QA basics.
- **Structured and bounded.** Use the output format above; prefer tables/bullets over prose. Report highest-severity/priority items first and stop once the useful signal is covered -- do not pad.
- **No unsolicited extras.** No alternative approaches, future-work essays, or re-derivations unless asked.
- **Assume, don't ask.** Make and record reasonable assumptions; raise a clarification only when a human decision genuinely blocks progress.
"""


def task_protocol(agent_name: str) -> str:
    return f"""\
## QA Task Protocol (required)

Part of the QA Agent Ecosystem. Follow on every run.

### 1. Inputs

- Read `.vscode/current_task/requirements.md` -- the task at hand. If missing or empty, ask the user to create it and STOP.
- If dispatched by **qa-manager**, also read only the dependency output files it names in `.vscode/current_task/`.

### 2. Clarifications gate (hard stop)

- Check `.vscode/current_task/clarifications.md` if present: any question to you (or the workflow) with **Answer** still `_pending_` means STOP -- list the blocking questions. Incorporate any answers already filled in.
- For a NEW ambiguity that needs a human/business decision, append it in this format, then STOP:

  ```markdown
  ## Q<n>: <one-line question>
  - **Status:** OPEN
  - **Asked by:** {agent_name} (step <NN>)
  - **Context:** <why this matters / what is blocked>
  - **Answer:** _pending_
  ```

- Only ask when a human decision is genuinely required; otherwise assume and document.

### 3. Results (traceability)

- Save your full results to `.vscode/current_task/<NN>-{agent_name}.md` (`<NN>` = step number from qa-manager, `00` standalone), with these sections so any reasoning error is traceable: **Inputs used**, **Assumptions**, **Work performed**, **Output**, **Files created/modified**, **Open issues**.
- Code and test artifacts go to their proper repo locations; this file records where.
"""


def render(data: dict) -> str:
    name = data["name"]
    tools = list(dict.fromkeys(TOOL_MAP[data["tool_set"]] + ALWAYS_TOOLS))
    tools_yaml = ", ".join(f"'{t}'" for t in tools)
    description = neutralize_tool_names(" ".join(data["description"].split()))

    body = neutralize_tool_names(data["prompt"].strip())
    if not body:
        body = (
            "Your full role definition and workflow live in the skill files "
            "listed below. Read them first -- they ARE your instructions."
        )

    skills_section = ""
    if data["skills"]:
        links = "\n".join(
            f"- `qa_ecosystem/skills/{s}.md`" for s in data["skills"]
        )
        skills_section = (
            "## Skills\n\n"
            "Read these skill files from the repository before starting and "
            "apply them throughout your work:\n\n" + links + "\n\n"
        )

    return (
        "---\n"
        f"name: {name}\n"
        f"description: {description}\n"
        f"tools: [{tools_yaml}]\n"
        "---\n\n"
        f"# {title_from_name(name)}\n\n"
        f"{body}\n\n"
        f"{OUTPUT_DISCIPLINE}\n"
        f"{skills_section}"
        f"{task_protocol(name)}"
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    generated = []
    for module_path in sorted(AGENTS_DIR.glob("*.py")):
        if module_path.name in SKIP_MODULES:
            continue
        data = extract(module_path)
        out_path = OUT_DIR / f"{data['name']}.agent.md"
        out_path.write_text(render(data), encoding="utf-8", newline="\n")
        generated.append(out_path.name)
    print(f"Generated {len(generated)} agent files in {OUT_DIR}:")
    for n in generated:
        print(f"  {n}")


if __name__ == "__main__":
    main()
