"""Shared CLI helpers used by multiple command modules."""

from __future__ import annotations

import argparse
from pathlib import Path

from rich.console import Console

console = Console()


def read_input(value: str) -> str:
    """If *value* is a path to an existing file, read its content; otherwise return as-is."""
    path = Path(value)
    if path.is_file():
        return path.read_text(encoding="utf-8")
    return value


def validate_url(url: str) -> str:
    """Validate that a URL looks well-formed. Returns the URL unchanged."""
    if not url.startswith(("http://", "https://")):
        console.print(
            f"[yellow]Warning: URL '{url}' does not start with http:// or https://. "
            "Make sure this is a valid URL.[/yellow]"
        )
    return url


def add_model_arg(parser: argparse.ArgumentParser) -> None:
    """Add the ``--model`` / ``-m`` flag to a subcommand parser."""
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
