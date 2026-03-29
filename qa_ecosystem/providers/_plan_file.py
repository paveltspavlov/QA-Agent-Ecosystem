"""Shared utility for saving execution plans to markdown files."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from rich.console import Console

console = Console()

# Import OUTPUTS_DIR from the main runner to keep paths consistent
try:
    from qa_ecosystem.runner import OUTPUTS_DIR
except ImportError:
    OUTPUTS_DIR = Path("outputs")


def save_plan_to_file(params) -> Path:
    """Save the proposed execution plan to a markdown file for external editing."""
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    plan_file = OUTPUTS_DIR / f"execution_plan_{timestamp}.md"

    lines = [
        "# Execution Plan\n",
        f"**Objective:** {params.objective}\n",
        "## Steps\n",
        "| Step | Agent | Description | Depends On |",
        "|------|-------|-------------|------------|",
    ]
    for s in params.steps:
        lines.append(f"| {s.step} | {s.agent_name} | {s.description} | {s.depends_on or '-'} |")
    lines.append("\n---\n*Edit this file, then re-run `qa-agent orchestrate` with the updated input.*\n")

    plan_file.write_text("\n".join(lines), encoding="utf-8")
    console.print(f"[dim]Plan saved to {plan_file} — edit and re-run.[/dim]\n")
    return plan_file
