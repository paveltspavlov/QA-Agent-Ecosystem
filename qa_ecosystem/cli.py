"""CLI entry point for the QA Agent Ecosystem."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from rich.console import Console
from rich.table import Table

from qa_ecosystem.config import AGENT_NAMES, PLAYWRIGHT_AGENT_NAMES

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

    table = Table(title="QA Agent Ecosystem — Agents (18)")
    table.add_column("Name", style="cyan", no_wrap=True)
    table.add_column("Category", style="magenta")
    table.add_column("Model", style="green")
    table.add_column("Description", style="white")

    for name, defn in list_agents().items():
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
# Playwright commands
# ---------------------------------------------------------------------------

def cmd_playwright_gen(args: argparse.Namespace) -> None:
    """Generate Playwright tests for a URL using a Playwright agent."""
    from qa_ecosystem.runner import run_single_agent, run_sync

    agent = args.agent or "playwright-test-generator"
    output_dir = args.output_dir or "playwright/tests"

    prompt = (
        f"Generate Playwright TypeScript test files for the following target:\n\n"
        f"URL: {args.url}\n"
        f"Output directory: {output_dir}\n"
    )
    if args.template != "default":
        from qa_ecosystem.templates import fill_template
        try:
            prompt = fill_template(agent, args.template, target_url=args.url, output_dir=output_dir)
        except (KeyError, FileNotFoundError):
            pass

    run_sync(run_single_agent(
        agent_name=agent,
        prompt=prompt,
        cwd=args.cwd,
        model_override=args.model,
    ))


def cmd_playwright_run(args: argparse.Namespace) -> None:
    """Execute Playwright tests and optionally analyze results."""
    pw_cmd = ["npx", "playwright", "test"]

    if args.project:
        pw_cmd += ["--project", args.project]
    if args.grep:
        pw_cmd += ["--grep", args.grep]

    pw_cmd += ["--reporter", args.reporter]

    console.print(f"[bold]Running:[/bold] {' '.join(pw_cmd)}\n")

    result = subprocess.run(
        pw_cmd,
        cwd=args.cwd,
        capture_output=True,
        text=True,
    )

    console.print(result.stdout)
    if result.stderr:
        console.print(f"[red]{result.stderr}[/red]")

    if result.returncode != 0:
        console.print(f"\n[yellow]Tests exited with code {result.returncode}[/yellow]")

    # Optionally analyze results with test-results-analyst
    if args.analyze and result.stdout:
        console.print("\n[bold]Analyzing results with test-results-analyst...[/bold]\n")
        from qa_ecosystem.runner import run_single_agent, run_sync

        analysis_prompt = (
            f"Analyze the following Playwright test execution output:\n\n"
            f"```\n{result.stdout}\n```\n\n"
            f"Exit code: {result.returncode}\n"
            f"Identify failures, flaky patterns, and recommendations."
        )

        run_sync(run_single_agent(
            agent_name="test-results-analyst",
            prompt=analysis_prompt,
            cwd=args.cwd,
            model_override=args.model,
        ))


def cmd_playwright_analyze(args: argparse.Namespace) -> None:
    """Run an analysis agent on Playwright test code."""
    from qa_ecosystem.runner import run_single_agent, run_sync

    agent = args.agent or "pr-hygiene-checker"
    input_path = Path(args.input)

    # Collect test file contents
    if input_path.is_file():
        content = input_path.read_text(encoding="utf-8")
        prompt = (
            f"Analyze the following test file ({input_path.name}):\n\n"
            f"```typescript\n{content}\n```"
        )
    elif input_path.is_dir():
        files = list(input_path.rglob("*.spec.ts")) + list(input_path.rglob("*.test.ts"))
        if not files:
            files = list(input_path.rglob("*.ts"))
        if not files:
            console.print(f"[red]No TypeScript test files found in {input_path}[/red]")
            sys.exit(1)

        file_listing = "\n".join(f"- {f.relative_to(input_path)}" for f in files[:50])
        prompt = (
            f"Analyze the Playwright test code in the directory: {input_path}\n\n"
            f"Files found ({len(files)}):\n{file_listing}\n\n"
            f"Read the files using the Read tool and perform your analysis."
        )
    else:
        prompt = args.input

    if args.template != "default":
        from qa_ecosystem.templates import fill_template
        try:
            prompt = fill_template(agent, args.template, file_paths=str(input_path))
        except (KeyError, FileNotFoundError):
            pass

    run_sync(run_single_agent(
        agent_name=agent,
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
            "(e.g. claude-sonnet, copilot-gpt4o, ollama-llama3). "
            "Overrides the default role mapping."
        ),
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="qa-agent",
        description="QA Agent Ecosystem — AI-powered QA agents with GitHub Copilot SDK & Playwright",
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

    # --- playwright-gen ---
    pw_gen = sub.add_parser("playwright-gen",
                            help="Generate Playwright tests for a URL")
    pw_gen.add_argument("--url", required=True,
                        help="Target URL to generate tests for")
    pw_gen.add_argument("--agent", choices=PLAYWRIGHT_AGENT_NAMES,
                        default="playwright-test-generator",
                        help="Agent to use (default: playwright-test-generator)")
    pw_gen.add_argument("--template", "-t", default="default",
                        help="Prompt template name")
    pw_gen.add_argument("--output-dir", default="playwright/tests",
                        help="Output directory for generated tests")
    pw_gen.add_argument("--cwd", default=".",
                        help="Working directory")
    _add_model_arg(pw_gen)

    # --- playwright-run ---
    pw_run = sub.add_parser("playwright-run",
                            help="Execute Playwright tests and analyze results")
    pw_run.add_argument("--project", default=None,
                        help="Playwright project name (e.g. chromium, firefox)")
    pw_run.add_argument("--grep", default=None,
                        help="Filter tests by title pattern")
    pw_run.add_argument("--reporter", default="list",
                        help="Playwright reporter (default: list)")
    pw_run.add_argument("--analyze", action="store_true",
                        help="Analyze results with test-results-analyst after run")
    pw_run.add_argument("--cwd", default="playwright",
                        help="Working directory (default: playwright/)")
    _add_model_arg(pw_run)

    # --- playwright-analyze ---
    pw_analyze = sub.add_parser("playwright-analyze",
                                help="Run analysis agents on Playwright test code")
    pw_analyze.add_argument("--agent", choices=PLAYWRIGHT_AGENT_NAMES,
                            default="pr-hygiene-checker",
                            help="Analysis agent to use (default: pr-hygiene-checker)")
    pw_analyze.add_argument("--input", "-i", required=True,
                            help="Test file or directory to analyze")
    pw_analyze.add_argument("--template", "-t", default="default",
                            help="Prompt template name")
    pw_analyze.add_argument("--cwd", default=".",
                            help="Working directory")
    _add_model_arg(pw_analyze)

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
        "playwright-gen": cmd_playwright_gen,
        "playwright-run": cmd_playwright_run,
        "playwright-analyze": cmd_playwright_analyze,
    }
    dispatch[args.command](args)


if __name__ == "__main__":
    main()
