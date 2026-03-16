"""CLI entry point for the QA Agent Ecosystem."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from rich.console import Console
from rich.table import Table

from qa_ecosystem.config import AGENT_NAMES

console = Console()


def _read_input(value: str) -> str:
    """If *value* is a path to an existing file, read its content; otherwise return as-is."""
    path = Path(value)
    if path.is_file():
        return path.read_text(encoding="utf-8")
    return value


# ---------------------------------------------------------------------------
# Subcommands
# ---------------------------------------------------------------------------

def cmd_list_agents(_args: argparse.Namespace) -> None:
    """Print all registered agents."""
    from qa_ecosystem.agents import list_agents

    table = Table(title="QA Agent Ecosystem — Agents")
    table.add_column("Name", style="cyan", no_wrap=True)
    table.add_column("Model", style="green")
    table.add_column("Description", style="white")

    for name, defn in list_agents().items():
        table.add_row(name, defn.model or "default", defn.description[:120])

    console.print(table)


def cmd_list_templates(args: argparse.Namespace) -> None:
    """Print available prompt templates."""
    from qa_ecosystem.templates import list_templates

    agents = [args.agent] if args.agent else AGENT_NAMES

    for agent_name in agents:
        try:
            templates = list_templates(agent_name)
        except FileNotFoundError:
            continue

        table = Table(title=f"Templates — {agent_name}")
        table.add_column("Name", style="cyan")
        table.add_column("Description", style="white")
        for t in templates:
            table.add_row(t["name"], t["description"])
        console.print(table)
        console.print()


def cmd_list_models(_args: argparse.Namespace) -> None:
    """Print all configured model profiles and role assignments."""
    from qa_ecosystem.models import list_profiles, list_roles

    # Role assignments
    roles = list_roles()
    role_table = Table(title="Role Assignments (models.yaml)")
    role_table.add_column("Role", style="bold cyan")
    role_table.add_column("Profile", style="green")
    for role, profile_name in roles.items():
        role_table.add_row(role, profile_name)
    console.print(role_table)
    console.print()

    # Profiles
    profiles = list_profiles()
    table = Table(title="Model Profiles (models.yaml)")
    table.add_column("Profile", style="cyan", no_wrap=True)
    table.add_column("Provider", style="magenta")
    table.add_column("Model ID", style="green")
    table.add_column("Endpoint", style="dim")
    table.add_column("Temp", style="yellow", justify="right")
    table.add_column("Max Tok", style="yellow", justify="right")

    for name, p in profiles.items():
        table.add_row(
            name,
            p.provider,
            p.model_id,
            p.api_base or "—",
            str(p.temperature),
            str(p.max_tokens),
        )

    console.print(table)
    console.print(
        "\n[dim]Edit qa_ecosystem/models.yaml to add, remove, or modify profiles.[/dim]"
    )


def cmd_run(args: argparse.Namespace) -> None:
    """Run a single agent."""
    from qa_ecosystem.runner import run_single_agent, run_sync
    from qa_ecosystem.templates import fill_template

    raw_input = _read_input(args.input)

    try:
        prompt = fill_template(
            args.agent,
            args.template,
            pbi_content=raw_input,
            bug_data=raw_input,
            test_suite_data=raw_input,
            results_data=raw_input,
        )
    except (KeyError, FileNotFoundError):
        prompt = raw_input

    run_sync(run_single_agent(
        agent_name=args.agent,
        prompt=prompt,
        cwd=args.cwd,
        model_override=args.model,
    ))


def cmd_orchestrate(args: argparse.Namespace) -> None:
    """Run the Test Manager orchestrator."""
    from qa_ecosystem.runner import run_orchestrator, run_sync
    from qa_ecosystem.templates import fill_template

    raw_input = _read_input(args.input)

    try:
        prompt = fill_template(
            "test-manager",
            args.template,
            project_context=raw_input,
            scope=raw_input,
        )
    except (KeyError, FileNotFoundError):
        prompt = raw_input

    run_sync(run_orchestrator(
        prompt=prompt,
        cwd=args.cwd,
        model_override=args.model,
    ))


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def _add_model_arg(parser: argparse.ArgumentParser) -> None:
    """Add the --model flag to a subcommand parser."""
    parser.add_argument(
        "--model", "-m",
        default=None,
        metavar="PROFILE",
        help=(
            "Model profile name from models.yaml "
            "(e.g. claude-sonnet, gpt-4o, ollama-llama3). "
            "Overrides the default role mapping."
        ),
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="qa-agent",
        description="QA Agent Ecosystem — AI-powered QA agents on the Claude Agent SDK",
    )
    sub = parser.add_subparsers(dest="command")

    # --- list-agents ---
    sub.add_parser("list-agents", help="List all registered QA agents")

    # --- list-templates ---
    lt = sub.add_parser("list-templates", help="List available prompt templates")
    lt.add_argument("--agent", "-a", choices=AGENT_NAMES, default=None,
                    help="Filter templates for a specific agent")

    # --- list-models ---
    sub.add_parser("list-models", help="List configured model profiles and role assignments")

    # --- run ---
    run = sub.add_parser("run", help="Run a single QA agent")
    run.add_argument("agent", choices=AGENT_NAMES, help="Agent to run")
    run.add_argument("--input", "-i", required=True,
                     help="Input text or path to a file")
    run.add_argument("--template", "-t", default="default",
                     help="Prompt template name (default: 'default')")
    run.add_argument("--cwd", default=".",
                     help="Working directory for the agent")
    _add_model_arg(run)

    # --- orchestrate ---
    orch = sub.add_parser("orchestrate", help="Run the Test Manager orchestrator")
    orch.add_argument("--input", "-i", required=True,
                      help="Input text or path to a file")
    orch.add_argument("--template", "-t", default="default",
                      help="Prompt template name (default: 'default')")
    orch.add_argument("--cwd", default=".",
                      help="Working directory for the orchestrator")
    _add_model_arg(orch)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(0)

    dispatch = {
        "list-agents": cmd_list_agents,
        "list-templates": cmd_list_templates,
        "list-models": cmd_list_models,
        "run": cmd_run,
        "orchestrate": cmd_orchestrate,
    }
    dispatch[args.command](args)


if __name__ == "__main__":
    main()
