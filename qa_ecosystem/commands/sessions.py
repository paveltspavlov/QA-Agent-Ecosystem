"""Session-inspection commands: list-sessions, show-session."""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

from rich.table import Table

from ._shared import console


def cmd_list_sessions(_args: argparse.Namespace) -> None:
    """Print all test execution sessions stored under outputs/."""
    from qa_ecosystem.session import list_sessions

    sessions = list_sessions()
    if not sessions:
        console.print("[yellow]No sessions found in outputs/.[/yellow]")
        return

    table = Table(title=f"Test Execution Sessions ({len(sessions)})")
    table.add_column("App", style="cyan", no_wrap=True)
    table.add_column("Timestamp", style="green")
    table.add_column("Modified", style="dim")
    table.add_column("Path", style="dim")
    for s in sessions:
        table.add_row(
            s["app"],
            s["timestamp"],
            datetime.fromtimestamp(s["mtime"]).strftime("%Y-%m-%d %H:%M:%S"),
            s["path"],
        )
    console.print(table)
    console.print("\n[dim]Inspect one with: qa-agent show-session <app/timestamp> | latest[/dim]\n")


def cmd_show_session(args: argparse.Namespace) -> None:
    """Show artifacts and metrics for a single session."""
    from qa_ecosystem.session import OUTPUTS_ROOT, list_sessions

    target = args.session
    if target == "latest":
        sessions = list_sessions()
        if not sessions:
            console.print("[yellow]No sessions found.[/yellow]")
            return
        session_dir = Path(sessions[0]["path"])
    else:
        candidate = Path(target)
        session_dir = candidate if candidate.is_absolute() else OUTPUTS_ROOT / target
        if not session_dir.is_dir():
            console.print(f"[red]Session not found: {session_dir}[/red]")
            return

    console.print(f"[bold cyan]Session:[/bold cyan] {session_dir}\n")

    manifest_path = session_dir / "manifest.json"
    if manifest_path.is_file():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        table = Table(title=f"Artifacts ({manifest['artifact_count']})")
        table.add_column("Path", style="cyan")
        table.add_column("Size", style="green", justify="right")
        for a in manifest["artifacts"]:
            table.add_row(a["path"], f"{a['size_bytes']:,} B")
        console.print(table)
    else:
        console.print("[yellow]No manifest.json — listing files directly.[/yellow]")
        for p in sorted(session_dir.rglob("*")):
            if p.is_file():
                console.print(f"  {p.relative_to(session_dir).as_posix()}")

    metrics_path = session_dir / "metrics.json"
    if metrics_path.is_file():
        m = json.loads(metrics_path.read_text(encoding="utf-8"))
        console.print(
            f"\n[bold]Metrics:[/bold] "
            f"{m['total_input_tokens']:,} in / {m['total_output_tokens']:,} out tokens, "
            f"${m['total_cost_usd']:.4f}, "
            f"{m['wall_clock_ms'] / 1000:.1f}s wall-clock, "
            f"{len(m['agents'])} agent calls."
        )


def register(sub) -> None:
    sub.add_parser("list-sessions", help="List all test execution sessions in outputs/")
    show_session = sub.add_parser("show-session", help="Show artifacts for one session")
    show_session.add_argument("session", help="Session path, or 'app/timestamp', or 'latest'")


COMMANDS = {
    "list-sessions": cmd_list_sessions,
    "show-session": cmd_show_session,
}
