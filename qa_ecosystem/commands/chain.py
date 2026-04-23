"""``qa-agent chain`` — execute a linear sequence of agents."""

from __future__ import annotations

import argparse

from qa_ecosystem.config import AGENT_NAMES

from ._shared import add_model_arg, console, read_input


def cmd_chain(args: argparse.Namespace) -> None:
    """Execute a linear agent sequence, piping each output as input to the next."""
    from qa_ecosystem.runner import run_chain, run_sync

    console.print(f"\n[bold cyan]Chain: {' → '.join(args.agents)}[/bold cyan]\n")
    initial_input = read_input(args.input)
    results = run_sync(run_chain(
        agents=args.agents,
        initial_input=initial_input,
        cwd=args.cwd,
        model_override=getattr(args, "model", None),
    ))
    console.print(f"\n[bold green]Chain complete — {len(results)} agent(s) ran.[/bold green]\n")


def register(sub) -> None:
    chain = sub.add_parser("chain", help="Execute a linear agent sequence (pipe output→input)")
    chain.add_argument("agents", nargs="+", choices=AGENT_NAMES,
                       help="Agents to chain in order (e.g. requirements-analyst test-case-generator)")
    chain.add_argument("--input", "-i", required=True,
                       help="Initial input text or path to a file")
    chain.add_argument("--cwd", default=".",
                       help="Working directory for agents")
    add_model_arg(chain)


COMMANDS = {"chain": cmd_chain}
