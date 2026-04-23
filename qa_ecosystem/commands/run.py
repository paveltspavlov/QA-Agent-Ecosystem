"""``qa-agent run`` — execute a single agent."""

from __future__ import annotations

import argparse

from qa_ecosystem.config import AGENT_NAMES

from ._shared import add_model_arg, console, read_input


def cmd_run(args: argparse.Namespace) -> None:
    """Run a single agent."""
    from qa_ecosystem.runner import run_single_agent, run_sync
    from qa_ecosystem.metrics import start_run, finish_run
    from qa_ecosystem.templates import fill_template

    raw_input = read_input(args.input)
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
            url=raw_input,
            target_url=raw_input,
            focus_areas="all pages, forms, and user journeys",
        )
    except (KeyError, FileNotFoundError):
        prompt = raw_input

    start_run()
    run_sync(run_single_agent(
        agent_name=args.agent,
        prompt=prompt,
        cwd=args.cwd,
        model_override=args.model,
        output_format=output_format,
    ))
    finish_run()


def register(sub) -> None:
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
    add_model_arg(run)


COMMANDS = {"run": cmd_run}
