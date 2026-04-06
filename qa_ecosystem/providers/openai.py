"""OpenAI / OpenAI-compatible execution path (GPT, Ollama, LM Studio, etc.)."""

from __future__ import annotations

from rich.console import Console

from qa_ecosystem.metrics import TokenUsage
from qa_ecosystem.models import ModelProfile
from qa_ecosystem.providers._common import has_question, prompt_user

console = Console()


async def run(system_prompt: str, user_prompt: str, profile: ModelProfile) -> tuple[str, TokenUsage]:
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

    # Only request usage stats from the official OpenAI API;
    # compatible endpoints (Ollama, LM Studio, etc.) may not support it.
    use_real_usage = profile.provider == "openai"

    messages: list[dict] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    all_turns: list[str] = []
    total_input_tokens = 0
    total_output_tokens = 0

    while True:
        collected: list[str] = []
        create_kwargs: dict = dict(
            model=profile.model_id,
            messages=messages,
            temperature=profile.temperature,
            max_tokens=profile.max_tokens,
            stream=True,
        )
        if use_real_usage:
            create_kwargs["stream_options"] = {"include_usage": True}

        stream = await client.chat.completions.create(**create_kwargs)

        turn_usage = None
        async for chunk in stream:
            if chunk.usage is not None:
                turn_usage = chunk.usage
            delta = chunk.choices[0].delta if chunk.choices else None
            if delta and delta.content:
                collected.append(delta.content)
                console.print(delta.content, end="")

        if turn_usage:
            total_input_tokens += turn_usage.prompt_tokens
            total_output_tokens += turn_usage.completion_tokens

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

    result = "\n\n".join(all_turns)

    if use_real_usage and total_input_tokens > 0:
        usage = TokenUsage(
            input_tokens=total_input_tokens,
            output_tokens=total_output_tokens,
            is_estimated=False,
        )
    else:
        # Fallback estimation for compatible endpoints
        usage = TokenUsage(
            input_tokens=(len(system_prompt) + len(user_prompt)) // 4,
            output_tokens=len(result) // 4,
            is_estimated=True,
        )

    return result, usage
