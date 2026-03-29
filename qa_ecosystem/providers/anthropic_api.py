"""Direct Anthropic Messages API execution path (no Claude Code CLI required)."""

from __future__ import annotations

import asyncio

from rich.console import Console

from qa_ecosystem.models import ModelProfile

console = Console()


async def run(system_prompt: str, user_prompt: str, profile: ModelProfile) -> str:
    """Execute via the Anthropic Messages API directly."""
    try:
        import anthropic as anthropic_sdk
    except ImportError:
        console.print(
            "[red]The 'anthropic' package is required for the anthropic-api provider.\n"
            "Install it with:  pip install anthropic[/red]"
        )
        raise SystemExit(1)

    api_key = profile.resolve_api_key()
    if not api_key:
        console.print(
            f"[red]No API key found for profile '{profile.name}'.\n"
            "Set the ANTHROPIC_API_KEY environment variable.[/red]"
        )
        raise SystemExit(1)

    client = anthropic_sdk.AsyncAnthropic(api_key=api_key)
    console.print(f"[dim]Streaming from Anthropic API: {profile.model_id} ...[/dim]\n")

    messages: list[dict] = [{"role": "user", "content": user_prompt}]
    all_turns: list[str] = []

    while True:
        collected: list[str] = []
        async with client.messages.stream(
            model=profile.model_id,
            system=system_prompt,
            messages=messages,
            temperature=profile.temperature,
            max_tokens=profile.max_tokens,
        ) as stream:
            async for text in stream.text_stream:
                collected.append(text)
                console.print(text, end="")

        console.print()
        turn_text = "".join(collected)
        all_turns.append(turn_text)
        messages.append({"role": "assistant", "content": turn_text})

        if not _has_question(turn_text):
            break

        user_reply = await _prompt_user()
        if user_reply is None:
            break
        messages.append({"role": "user", "content": user_reply})

    return "\n\n".join(all_turns)


def _has_question(text: str) -> bool:
    """Return True if the agent's response ends with a question."""
    lines = [ln.strip() for ln in text.strip().splitlines() if ln.strip()]
    if not lines:
        return False
    return lines[-1].endswith("?")


async def _prompt_user() -> str | None:
    """Prompt the user for a reply in the terminal."""
    console.print("\n[bold yellow]Agent is asking a question. Type your reply (or press Enter to skip):[/bold yellow]")
    loop = asyncio.get_event_loop()
    reply = await loop.run_in_executor(None, lambda: input("> ").strip())
    if not reply:
        console.print("[dim]No reply given — continuing without response.[/dim]\n")
        return None
    console.print()
    return reply
