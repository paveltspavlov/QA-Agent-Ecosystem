"""Generate GitHub Copilot custom agent files (.github/agents/*.agent.md)
from the Python agent definitions in qa_ecosystem/agents/.

Run from the repo root:
    python scripts/generate_copilot_agents.py

The orchestrator (test-manager) is NOT generated here -- it is maintained by
hand as .github/agents/qa-manager.agent.md because it carries the workflow
catalog and the current-task protocol in full.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
AGENTS_DIR = REPO_ROOT / "qa_ecosystem" / "agents"
OUT_DIR = REPO_ROOT / ".github" / "agents"

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


def task_protocol(agent_name: str) -> str:
    return f"""\
## QA Task Protocol (required)

You are part of the QA Agent Ecosystem in this repository. Follow this protocol on every run.

### 1. Inputs

- Read `.vscode/current_task/requirements.md` -- the description of the task at hand. If it does not exist or is empty, ask the user to create it and STOP.
- If you were dispatched by the **qa-manager** agent, also read the output files of the steps you depend on in `.vscode/current_task/` (qa-manager names them in your dispatch instructions).

### 2. Clarifications gate (hard stop)

- Before doing any work, check `.vscode/current_task/clarifications.md` (if present):
  - If it contains questions addressed to you (or to the whole workflow) whose **Answer** field is still `_pending_`, STOP and tell the user which questions are blocking.
  - If previously asked questions now have answers, incorporate them and continue.
- If you discover NEW ambiguities that the user or business stakeholders must resolve, append each one to `.vscode/current_task/clarifications.md` in this format, then STOP and tell the user to fill in the **Answer** fields:

  ```markdown
  ## Q<n>: <one-line question>
  - **Status:** OPEN
  - **Asked by:** {agent_name} (step <NN>)
  - **Context:** <why this matters / what is blocked>
  - **Answer:** _pending_
  ```

  When the user fills in **Answer** (and ideally flips **Status** to ANSWERED), the workflow resumes on the next run.
- Only ask questions that genuinely require a human decision. Make and document reasonable technical assumptions yourself.

### 3. Results (traceability)

- Save the complete results of your work to `.vscode/current_task/<NN>-{agent_name}.md`, where `<NN>` is the two-digit step number assigned by qa-manager (use `00` when run standalone).
- The results file MUST contain these sections so the user can trace back any reasoning error or hallucination:
  - **Inputs used** -- every file you read, with paths.
  - **Assumptions** -- everything you assumed instead of asking.
  - **Work performed** -- a concise log of what you did and why.
  - **Output** -- your full deliverable.
  - **Files created/modified** -- repo paths of all artifacts you wrote.
  - **Open issues** -- anything unresolved or deferred.
- Code and test artifacts still go to their proper locations in the repo; the results file records where.
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
