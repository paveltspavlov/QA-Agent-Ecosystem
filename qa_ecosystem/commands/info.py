"""Read-only info commands: list-agents, list-templates, list-models, list-skills, list-workflows."""

from __future__ import annotations

import argparse

from rich.table import Table

from qa_ecosystem.config import AGENT_NAMES

from ._shared import console


def cmd_list_agents(_args: argparse.Namespace) -> None:
    """Print all registered agents."""
    from qa_ecosystem.agents import list_agents

    agents = list_agents()
    table = Table(title=f"QA Agent Ecosystem — Agents ({len(agents)})")
    table.add_column("Name", style="cyan", no_wrap=True)
    table.add_column("Category", style="magenta")
    table.add_column("Model", style="green")
    table.add_column("Description", style="white")

    for name, defn in agents.items():
        category = getattr(defn, "category", "planning")
        table.add_row(name, category, defn.model or "default", defn.description[:100])

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
    from qa_ecosystem.models import list_profiles, list_roles, _role_overrides

    roles = list_roles()
    role_table = Table(title="Role Assignments (models.yaml)")
    role_table.add_column("Role", style="bold cyan")
    role_table.add_column("Profile", style="green")
    role_table.add_column("Source", style="dim")
    all_roles = {**roles, **_role_overrides}
    for role, profile_name in all_roles.items():
        if role in _role_overrides:
            role_table.add_row(role, _role_overrides[role], "--role override")
        else:
            role_table.add_row(role, profile_name, "models.yaml")
    console.print(role_table)
    console.print()

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
        "\n[dim]Edit qa_ecosystem/models.yaml to add, remove, or modify profiles. "
        "Use --role ROLE=PROFILE to override at runtime.[/dim]"
    )


def cmd_list_skills(_args: argparse.Namespace) -> None:
    """Print all available shared skills."""
    from qa_ecosystem.skill_loader import list_skills, load_skill

    skills = list_skills()
    if not skills:
        console.print("[yellow]No skills found in qa_ecosystem/skills/[/yellow]")
        return

    table = Table(title=f"QA Agent Ecosystem — Shared Skills ({len(skills)})")
    table.add_column("Skill Name", style="cyan", no_wrap=True)
    table.add_column("Preview (first 120 chars)", style="white")

    for name in skills:
        try:
            preview = load_skill(name)[:120].replace("\n", " ")
        except Exception:
            preview = "(error loading skill)"
        table.add_row(name, preview)

    console.print(table)
    console.print("\n[dim]Skills directory: qa_ecosystem/skills/[/dim]\n")


def cmd_list_workflows(_args: argparse.Namespace) -> None:
    """Print all orchestration workflows loaded from workflows.yaml."""
    from qa_ecosystem.workflow_executor import list_workflows

    workflows = list_workflows()
    if not workflows:
        console.print("[yellow]No workflows found in workflows.yaml.[/yellow]")
        return

    table = Table(title=f"QA Agent Ecosystem — Orchestration Workflows ({len(workflows)})")
    table.add_column("#", style="dim", width=3)
    table.add_column("Key", style="bold green", no_wrap=True, min_width=22)
    table.add_column("Name", style="cyan", min_width=28)
    table.add_column("Steps", style="yellow", justify="right", width=5)
    table.add_column("Agent Sequence", style="white", min_width=50)

    for idx, (key, wf) in enumerate(workflows.items(), 1):
        agents = " → ".join(s.agent for s in sorted(wf.steps, key=lambda s: s.index))
        table.add_row(str(idx), key, wf.name, str(len(wf.steps)), agents)

    console.print(table)
    console.print(
        "\n[bold]Usage:[/bold]\n"
        "  qa-agent workflow <key> -i <input>          [dim]# shorthand[/dim]\n"
        "  qa-agent orchestrate -w <key> -i <input>    [dim]# full form[/dim]\n"
        "\n[dim]Example: qa-agent workflow feature-testing -i requirements.md[/dim]\n"
        "[dim]Dry run: qa-agent workflow feature-testing -i requirements.md --dry-run[/dim]\n"
    )


def register(sub) -> None:
    sub.add_parser("list-agents", help="List all registered QA agents")

    lt = sub.add_parser("list-templates", help="List available prompt templates")
    lt.add_argument("--agent", "-a", choices=AGENT_NAMES, default=None,
                    help="Filter templates for a specific agent")

    sub.add_parser("list-models", help="List configured model profiles and role assignments")
    sub.add_parser("list-skills", help="List all available shared prompt skill fragments")
    sub.add_parser("list-workflows", help="List all orchestration workflows")


COMMANDS = {
    "list-agents": cmd_list_agents,
    "list-templates": cmd_list_templates,
    "list-models": cmd_list_models,
    "list-skills": cmd_list_skills,
    "list-workflows": cmd_list_workflows,
}
