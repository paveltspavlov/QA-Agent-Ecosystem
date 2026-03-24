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


def _validate_url(url: str) -> str:
    """Validate that a URL looks well-formed. Returns the URL unchanged."""
    if not url.startswith(("http://", "https://")):
        console.print(
            f"[yellow]Warning: URL '{url}' does not start with http:// or https://. "
            "Make sure this is a valid URL.[/yellow]"
        )
    return url


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

    output_format = getattr(args, "output_format", "markdown") or "markdown"

    if getattr(args, "dry_run", False):
        console.print(
            f"[bold yellow]Dry run — would execute agent:[/bold yellow] {args.agent}\n"
            f"[dim]Input length: {len(raw_input)} chars[/dim]\n"
            f"[dim]Template: {args.template}[/dim]\n"
            f"[dim]Output format: {output_format}[/dim]\n"
            f"[dim]Model override: {args.model or 'none'}[/dim]"
        )
        return

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
        output_format=output_format,
    ))


def cmd_orchestrate(args: argparse.Namespace) -> None:
    """Run the Test Manager orchestrator."""
    from qa_ecosystem.runner import run_orchestrator, run_sync
    from qa_ecosystem.templates import fill_template

    raw_input = _read_input(args.input)

    if getattr(args, "dry_run", False):
        console.print(
            f"[bold yellow]Dry run — would execute orchestrator[/bold yellow]\n"
            f"[dim]Input length: {len(raw_input)} chars[/dim]\n"
            f"[dim]Template: {args.template}[/dim]\n"
            f"[dim]Model override: {args.model or 'none'}[/dim]"
        )
        return

    try:
        prompt = fill_template(
            "test-manager",
            args.template,
            project_context=raw_input,
            scope=raw_input,
        )
    except (KeyError, FileNotFoundError):
        prompt = raw_input

    resume_from = None
    resume_path = getattr(args, "resume", None)
    if resume_path:
        from qa_ecosystem.checkpoint import load_checkpoint
        resume_from = load_checkpoint(resume_path)
        console.print(
            f"[dim]Resuming from checkpoint: {resume_path} "
            f"({len(resume_from.steps)} completed steps)[/dim]\n"
        )

    run_sync(run_orchestrator(
        prompt=prompt,
        cwd=args.cwd,
        model_override=args.model,
        resume_from=resume_from,
    ))


# ---------------------------------------------------------------------------
# Playwright commands
# ---------------------------------------------------------------------------

def cmd_playwright_gen(args: argparse.Namespace) -> None:
    """Generate Playwright tests for a URL using a Playwright agent."""
    from qa_ecosystem.runner import run_single_agent, run_sync

    _validate_url(args.url)

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
# New commands: init, doctor, list-workflows, chain
# ---------------------------------------------------------------------------

def cmd_init(_args: argparse.Namespace) -> None:
    """Interactive setup wizard — create .env and validate configuration."""
    from pathlib import Path
    from rich.prompt import Prompt, Confirm

    console.print("\n[bold cyan]QA Agent Ecosystem — Setup Wizard[/bold cyan]\n")

    provider = Prompt.ask(
        "Which AI provider will you use?",
        choices=["copilot", "anthropic-api", "openai", "local"],
        default="copilot",
    )

    env_lines = [
        "# QA Agent Ecosystem — generated by `qa-agent init`",
        "",
    ]

    if provider == "copilot":
        console.print("\n[dim]GitHub Copilot uses `gh auth login` for authentication.[/dim]")
        console.print("[dim]Run `gh auth login --web` if you have not authenticated yet.[/dim]\n")
        token = Prompt.ask("GITHUB_TOKEN (optional — leave blank to use gh auth)", default="")
        if token:
            env_lines.append(f"GITHUB_TOKEN={token}")
    elif provider == "anthropic-api":
        key = Prompt.ask("ANTHROPIC_API_KEY")
        env_lines.append(f"ANTHROPIC_API_KEY={key}")
    elif provider == "openai":
        key = Prompt.ask("OPENAI_API_KEY")
        env_lines.append(f"OPENAI_API_KEY={key}")
    elif provider == "local":
        console.print("[dim]Local models (Ollama/LM Studio) do not require API keys.[/dim]")

    env_path = Path(".env")
    if env_path.exists():
        overwrite = Confirm.ask(".env already exists — overwrite?", default=False)
        if not overwrite:
            console.print("[yellow]Skipped writing .env.[/yellow]")
            return

    env_path.write_text("\n".join(env_lines) + "\n", encoding="utf-8")
    console.print(f"\n[green]✅  .env written to {env_path.resolve()}[/green]\n")
    console.print("[dim]Running doctor to validate...[/dim]\n")
    cmd_doctor(_args)


def cmd_doctor(_args: argparse.Namespace) -> None:
    """Validate configuration, API keys, gh auth, and Playwright."""
    import os
    from pathlib import Path

    checks: list[tuple[str, bool, str]] = []

    # 1. .env file
    env_exists = Path(".env").exists()
    checks.append((".env file present", env_exists, "Run `qa-agent init` or copy .env.example to .env"))

    # 2. Default model API key
    try:
        from qa_ecosystem.models import resolve_model
        profile = resolve_model()
        key_ok = profile.resolve_api_key() is not None
        checks.append((
            f"API key for default profile ({profile.name})",
            key_ok,
            f"Set the required env var (e.g. ANTHROPIC_API_KEY) in your .env file",
        ))
    except Exception as exc:
        checks.append(("Default model profile resolves", False, str(exc)))

    # 3. gh auth
    try:
        result = subprocess.run(
            ["gh", "auth", "status"],
            capture_output=True, text=True, timeout=10
        )
        gh_ok = result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        gh_ok = False
    checks.append(("GitHub CLI authenticated (gh auth status)", gh_ok,
                   "Run `gh auth login --web` to authenticate"))

    # 4. Playwright
    try:
        result = subprocess.run(
            ["npx", "playwright", "--version"],
            capture_output=True, text=True, timeout=15, cwd="playwright"
        )
        pw_ok = result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        pw_ok = False
    checks.append(("Playwright installed (npx playwright)", pw_ok,
                   "Run `cd playwright && npm install && npx playwright install --with-deps`"))

    # 5. models.yaml parses
    try:
        from qa_ecosystem.models import list_profiles
        profiles = list_profiles()
        yaml_ok = len(profiles) >= 1
    except Exception as exc:
        yaml_ok = False
    checks.append(("models.yaml valid and has profiles", yaml_ok,
                   "Check qa_ecosystem/models.yaml for YAML syntax errors"))

    console.print("\n[bold]QA Agent Ecosystem — Doctor[/bold]\n")
    all_ok = True
    for label, ok, fix in checks:
        icon = "[green]✅[/green]" if ok else "[red]❌[/red]"
        console.print(f"  {icon}  {label}")
        if not ok:
            console.print(f"     [dim]→ {fix}[/dim]")
            all_ok = False

    console.print()
    if all_ok:
        console.print("[bold green]All checks passed — you're ready to go![/bold green]\n")
    else:
        console.print("[bold yellow]Some checks failed. See hints above.[/bold yellow]\n")


def cmd_list_workflows(_args: argparse.Namespace) -> None:
    """Print all 20 orchestration workflows."""
    WORKFLOWS = [
        ("1",  "New Feature Testing",          "PBI / user story",                   "requirements-analyst → [human input] → test-case-generator + synthetic-data-designer + test-oracle-creator → testware-creator → test-results-analyst"),
        ("2",  "Bug Prevention & Analysis",    "Bug reports / defect history",        "bug-pattern-analyst → requirements-analyst → test-case-generator → testware-creator"),
        ("3",  "Sprint Regression Optimisation","Sprint scope + existing suite",       "regression-optimizer → test-case-generator → testware-creator → test-results-analyst"),
        ("4",  "Playwright Test Generation",   "App URL",                             "playwright-test-generator → ui-test-designer → seed-data-manager → coverage-hunter → pr-hygiene-checker"),
        ("5",  "Flaky Test Investigation",     "Flaky test files + CI logs",          "flake-triage → playwright-test-generator → pr-hygiene-checker"),
        ("6",  "UI Mockup Comparison",         "Mockup image/file + App URL",         "requirements-analyst + ui-test-designer → playwright-test-generator → testware-creator (bug reports)"),
        ("7",  "Full API Test Coverage",       "OpenAPI spec / endpoint list",        "api-coverage-planner → playwright-test-generator → coverage-hunter → pr-hygiene-checker"),
        ("8",  "Security Audit",               "Codebase path / test directory",      "security-scout → requirements-analyst → testware-creator"),
        ("9",  "Test Data Bootstrap",          "PBIs / data requirements",            "synthetic-data-designer → seed-data-manager → test-oracle-creator"),
        ("10", "Full Test Health Audit",       "Test directory + recent results",     "coverage-hunter → flake-triage → pr-hygiene-checker → test-results-analyst → testware-creator"),
        ("11", "Cross-Browser Testing",        "App URL + feature list",              "ui-test-designer → playwright-test-generator → test-results-analyst → testware-creator"),
        ("12", "Responsive / Mobile Testing",  "App URL + breakpoints",               "ui-test-designer → playwright-test-generator → test-results-analyst → testware-creator"),
        ("13", "AI/ML Feature Testing",        "AI feature requirements",             "ai-test-architect → test-case-generator → synthetic-data-designer → test-oracle-creator → testware-creator"),
        ("14", "Release Sign-off",             "Release version + test scope",        "regression-optimizer → test-results-analyst → testware-creator (sign-off report)"),
        ("15", "User Journey Mapping",         "User personas + App URL",             "requirements-analyst → test-case-generator → ui-test-designer → playwright-test-generator"),
        ("16", "Test Data Cleanup & Maintenance","Test data directory",               "seed-data-manager → synthetic-data-designer → testware-creator"),
        ("17", "Exploratory Testing Planner",  "Feature scope + risk areas",          "requirements-analyst → bug-pattern-analyst → testware-creator (charters)"),
        ("18", "PR / Code Review QA Gate",     "PR diff + test files",                "pr-hygiene-checker → coverage-hunter → security-scout → testware-creator"),
        ("19", "Post-Deployment Smoke",        "App URL + environment name",          "playwright-test-generator → ui-test-designer → test-results-analyst → testware-creator"),
        ("20", "Requirements Traceability",    "Requirements doc + test suite",       "requirements-analyst → test-case-generator → testware-creator (traceability matrix)"),
    ]

    table = Table(title="QA Agent Ecosystem — 20 Orchestration Workflows")
    table.add_column("#", style="dim", width=3)
    table.add_column("Workflow", style="cyan", min_width=28)
    table.add_column("Input Required", style="yellow", min_width=28)
    table.add_column("Agent Sequence", style="white", min_width=50)

    for row in WORKFLOWS:
        table.add_row(*row)

    console.print(table)
    console.print("\n[dim]Run: qa-agent orchestrate -i <input> -t <workflow-template>[/dim]\n")


def cmd_chain(args: argparse.Namespace) -> None:
    """Execute a linear agent sequence, piping each output as input to the next."""
    from qa_ecosystem.runner import run_chain, run_sync

    console.print(f"\n[bold cyan]Chain: {' → '.join(args.agents)}[/bold cyan]\n")
    initial_input = _read_input(args.input)
    results = run_sync(run_chain(
        agents=args.agents,
        initial_input=initial_input,
        cwd=args.cwd,
        model_override=getattr(args, "model", None),
    ))
    console.print(f"\n[bold green]Chain complete — {len(results)} agent(s) ran.[/bold green]\n")


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

    # Root-level flags
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        default=False,
        help="Enable verbose output (full prompts, responses, and profile details)",
    )
    parser.add_argument(
        "--log-file",
        default=None,
        metavar="PATH",
        help="Write structured JSON log entries to this file",
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
    run.add_argument("--dry-run", action="store_true", default=False,
                     help="Print what would be executed without running the agent")
    run.add_argument("--output-format", default="markdown",
                     choices=["markdown", "json"],
                     help="Output format for saved results (default: markdown)")
    _add_model_arg(run)

    # --- orchestrate ---
    orch = sub.add_parser("orchestrate", help="Run the Test Manager orchestrator")
    orch.add_argument("--input", "-i", required=True,
                      help="Input text or path to a file")
    orch.add_argument("--template", "-t", default="default",
                      help="Prompt template name (default: 'default')")
    orch.add_argument("--cwd", default=".",
                      help="Working directory for the orchestrator")
    orch.add_argument("--dry-run", action="store_true", default=False,
                      help="Print what would be executed without running the orchestrator")
    orch.add_argument("--resume", default=None,
                      metavar="CHECKPOINT_FILE",
                      help="Resume from a checkpoint file (outputs/checkpoints/<id>.json)")
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

    # --- init ---
    sub.add_parser("init", help="Interactive setup wizard — create .env and validate config")

    # --- doctor ---
    sub.add_parser("doctor", help="Validate configuration, API keys, gh auth, and Playwright")

    # --- list-workflows ---
    sub.add_parser("list-workflows", help="List all 20 orchestration workflows")

    # --- chain ---
    chain = sub.add_parser("chain", help="Execute a linear agent sequence (pipe output→input)")
    chain.add_argument("agents", nargs="+", choices=AGENT_NAMES,
                       help="Agents to chain in order (e.g. requirements-analyst test-case-generator)")
    chain.add_argument("--input", "-i", required=True,
                       help="Initial input text or path to a file")
    chain.add_argument("--cwd", default=".",
                       help="Working directory for agents")
    _add_model_arg(chain)

    return parser


def main() -> None:
    import qa_ecosystem.runner as _runner

    parser = build_parser()
    args = parser.parse_args()

    # Handle root-level flags
    if getattr(args, "verbose", False):
        _runner.VERBOSE = True

    log_file = getattr(args, "log_file", None)
    if log_file:
        _runner.LOG_FILE = Path(log_file)

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
        "init": cmd_init,
        "doctor": cmd_doctor,
        "list-workflows": cmd_list_workflows,
        "chain": cmd_chain,
    }
    dispatch[args.command](args)


if __name__ == "__main__":
    main()
