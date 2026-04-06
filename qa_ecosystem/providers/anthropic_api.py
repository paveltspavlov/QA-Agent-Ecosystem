"""Direct Anthropic Messages API execution path (no Claude Code CLI required)."""

from __future__ import annotations

from rich.console import Console

from qa_ecosystem.metrics import TokenUsage
from qa_ecosystem.models import ModelProfile
from qa_ecosystem.providers._common import has_question, prompt_user

console = Console()


async def run(system_prompt: str, user_prompt: str, profile: ModelProfile) -> tuple[str, TokenUsage]:
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
    total_input_tokens = 0
    total_output_tokens = 0

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
            final_message = await stream.get_final_message()
            total_input_tokens += final_message.usage.input_tokens
            total_output_tokens += final_message.usage.output_tokens

        console.print()
        turn_text = "".join(collected)
        all_turns.append(turn_text)
        messages.append({"role": "assistant", "content": turn_text})

        if not has_question(turn_text):
            break

        user_reply = await prompt_user()
        if user_reply is None:
            break
        messages.append({"role": "user", "content": user_reply})

    return "\n\n".join(all_turns), TokenUsage(
        input_tokens=total_input_tokens,
        output_tokens=total_output_tokens,
        is_estimated=False,
    )
