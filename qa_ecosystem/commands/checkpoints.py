"""Checkpoint commands: list-checkpoints, clean-checkpoints."""

from __future__ import annotations

import argparse

from rich.table import Table

from ._shared import console


def cmd_list_checkpoints(_args: argparse.Namespace) -> None:
    """Print all saved orchestration checkpoint sessions."""
    from qa_ecosystem.checkpoint import list_checkpoints

    checkpoints = list_checkpoints()
    if not checkpoints:
        console.print("[yellow]No checkpoints found.[/yellow]")
        return

    table = Table(title=f"Orchestration Checkpoints ({len(checkpoints)})")
    table.add_column("Session ID", style="cyan", no_wrap=True)
    table.add_column("Workflow", style="magenta")
    table.add_column("Created", style="green")
    table.add_column("Updated", style="green")
    table.add_column("Steps", style="white")
    table.add_column("File", style="dim")

    for cp in checkpoints:
        steps_info = f"{cp['completed_steps']}/{cp['total_steps']}"
        table.add_row(
            cp["session_id"],
            cp.get("workflow_name") or "-",
            cp["created_at"][:19],
            cp["updated_at"][:19],
            steps_info,
            cp["file"],
        )

    console.print(table)
    console.print("\n[dim]Resume with: qa-agent orchestrate --resume <file>[/dim]\n")


def cmd_clean_checkpoints(args: argparse.Namespace) -> None:
    """Remove old checkpoint files."""
    from qa_ecosystem.checkpoint import clean_checkpoints

    keep = getattr(args, "keep", 5)
    removed = clean_checkpoints(keep_last=keep)
    if removed:
        console.print(f"[green]Removed {removed} old checkpoint(s), kept {keep} most recent.[/green]")
    else:
        console.print("[dim]No checkpoints to clean.[/dim]")


def register(sub) -> None:
    sub.add_parser("list-checkpoints", help="List all saved orchestration checkpoint sessions")
    clean_cp = sub.add_parser("clean-checkpoints", help="Remove old checkpoint files")
    clean_cp.add_argument("--keep", type=int, default=5,
                          help="Number of most recent checkpoints to keep (default: 5)")


COMMANDS = {
    "list-checkpoints": cmd_list_checkpoints,
    "clean-checkpoints": cmd_clean_checkpoints,
}
