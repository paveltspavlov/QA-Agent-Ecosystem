"""Shared utilities for LLM provider modules."""

from __future__ import annotations

import asyncio

from rich.console import Console

console = Console()


def has_question(text: str) -> bool:
    """Return True if the agent's response ends with a question."""
    lines = [ln.strip() for ln in text.strip().splitlines() if ln.strip()]
    if not lines:
        return False
    return lines[-1].endswith("?")


async def prompt_user() -> str | None:
    """Prompt the user for a reply in the terminal."""
    console.print("\n[bold yellow]Agent is asking a question. Type your reply (or press Enter to skip):[/bold yellow]")
    loop = asyncio.get_event_loop()
    reply = await loop.run_in_executor(None, lambda: input("> ").strip())
    if not reply:
        console.print("[dim]No reply given — continuing without response.[/dim]\n")
        return None
    console.print()
    return reply
