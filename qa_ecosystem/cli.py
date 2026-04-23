"""CLI entry point for the QA Agent Ecosystem.

Each subcommand lives in its own module under ``qa_ecosystem.commands``.
This file wires them together and handles the root-level flags
(``--verbose``, ``--log-file``, ``--role``).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from rich.console import Console

from qa_ecosystem.commands import ALL_MODULES

console = Console()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="qa-agent",
        description="QA Agent Ecosystem — AI-powered QA agents with GitHub Copilot SDK & Playwright",
    )

    parser.add_argument(
        "--verbose", "-v", action="store_true", default=False,
        help="Enable verbose output (full prompts, responses, and profile details)",
    )
    parser.add_argument(
        "--log-file", default=None, metavar="PATH",
        help="Write structured JSON log entries to this file",
    )
    parser.add_argument(
        "--role", action="append", default=[], metavar="ROLE=PROFILE",
        help=(
            "Override a role→profile mapping for this run "
            "(e.g. --role default=copilot-claude-sonnet --role orchestrator=claude-opus-api). "
            "Repeatable."
        ),
    )

    sub = parser.add_subparsers(dest="command")
    for module in ALL_MODULES:
        module.register(sub)

    return parser


def _build_dispatch() -> dict:
    dispatch: dict = {}
    for module in ALL_MODULES:
        dispatch.update(module.COMMANDS)
    return dispatch


def main() -> None:
    # Force UTF-8 on Windows where the default console encoding (cp1252) can't
    # encode Unicode characters used in help text (e.g. →).
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except AttributeError:
            pass

    import qa_ecosystem.runner as _runner

    parser = build_parser()
    args = parser.parse_args()

    if getattr(args, "verbose", False):
        _runner.VERBOSE = True

    log_file = getattr(args, "log_file", None)
    if log_file:
        _runner.LOG_FILE = Path(log_file)

    role_overrides = getattr(args, "role", []) or []
    if role_overrides:
        from qa_ecosystem.models import set_role_overrides
        parsed: dict[str, str] = {}
        for spec in role_overrides:
            if "=" not in spec:
                console.print(f"[red]--role expects ROLE=PROFILE, got {spec!r}[/red]")
                sys.exit(2)
            role, profile = spec.split("=", 1)
            parsed[role.strip()] = profile.strip()
        try:
            set_role_overrides(parsed)
        except KeyError as e:
            console.print(f"[red]{e}[/red]")
            sys.exit(2)

    if args.command is None:
        parser.print_help()
        sys.exit(0)

    dispatch = _build_dispatch()
    handler = dispatch.get(args.command)
    if handler is None:
        console.print(f"[red]Unknown command: {args.command}[/red]")
        sys.exit(2)
    handler(args)


if __name__ == "__main__":
    main()
