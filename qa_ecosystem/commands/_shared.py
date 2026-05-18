"""Shared CLI helpers used by multiple command modules."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from rich.console import Console

console = Console()


def read_input(value: str) -> str:
    """If *value* is a path to an existing file, read its content; otherwise return as-is."""
    path = Path(value)
    if path.is_file():
        return path.read_text(encoding="utf-8")
    return value


_FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.DOTALL)
_PROJECT_NAME_RE = re.compile(r"^project_name\s*:\s*(.+?)\s*$", re.MULTILINE)


def read_task_input(value: str) -> tuple[str, str | None]:
    """Read a task input (text or file) and extract optional ``project_name``.

    If the source is a markdown file with YAML frontmatter, parse the
    ``project_name`` key. The frontmatter block is stripped from the returned
    body. Returns ``(task_body, project_name_or_None)``.
    """
    raw = read_input(value)
    match = _FRONTMATTER_RE.match(raw)
    if not match:
        return raw, None

    frontmatter = match.group(1)
    body = raw[match.end():]
    name_match = _PROJECT_NAME_RE.search(frontmatter)
    project_name = None
    if name_match:
        project_name = name_match.group(1).strip().strip('"').strip("'") or None
    return body, project_name


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
