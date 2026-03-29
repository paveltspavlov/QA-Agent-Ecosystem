"""OpenAI / OpenAI-compatible execution path (GPT, Ollama, LM Studio, etc.)."""

from __future__ import annotations

import asyncio

from rich.console import Console

from qa_ecosystem.models import ModelProfile

console = Console()


async def run(system_prompt: str, user_prompt: str, profile: ModelProfile) -> str:
    """Execute via the OpenAI Chat Completions API."""
    try:
        from openai import AsyncOpenAI
    except ImportError:
        console.print(
            "[red]The 'openai' package is required for non-Claude models.\n"
            "Install it with:  pip install openai[/red]"
        )
        raise SystemExit(1)

    api_key = profile.resolve_api_key()
    if not api_key:
        console.print(
            f"[red]No API key found for profile '{profile.name}'.\n"
            f"Set the {profile.api_key_env or 'API key'} environment variable.[/red]"
        )
        raise SystemExit(1)

    client_kwargs: dict = {"api_key": api_key}
    if profile.api_base:
        client_kwargs["base_url"] = profile.api_base

    client = AsyncOpenAI(**client_kwargs)

    console.print(f"[dim]Streaming from {profile.provider}:{profile.model_id} ...[/dim]\n")

    messages: list[dict] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    all_turns: list[str] = []

    while True:
        collected: list[str] = []
        stream = await client.chat.completions.create(
            model=profile.model_id,
            messages=messages,
            temperature=profile.temperature,
            max_tokens=profile.max_tokens,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta if chunk.choices else None
            if delta and delta.content:
                collected.append(delta.content)
                console.print(delta.content, end="")

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
