"""Core execution logic — bridges CLI to Claude Agent SDK **and** OpenAI-compatible providers.

Execution paths
───────────────
• **Claude provider** → ``claude_agent_sdk.query()`` with full tool & subagent support.
• **OpenAI / OpenAI-compatible provider** → ``openai.AsyncOpenAI`` chat completions.
  Tools and subagent orchestration are *not* available on this path; the agent's
  system prompt is sent as a system message and the user prompt as a user message.
  This is ideal for cost-effective drafting, local experimentation, or when the
  full Agent SDK tool-use is not required.
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime
from pathlib import Path

from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel

from qa_ecosystem.config import DEFAULT_PERMISSION_MODE, MAX_TURNS_ORCHESTRATED, MAX_TURNS_SINGLE
from qa_ecosystem.models import ModelProfile, resolve_model

console = Console()

OUTPUTS_DIR = Path(__file__).resolve().parent.parent / "outputs"


def _save_agent_result(agent_name: str, result: str) -> Path:
    """Save an agent result to outputs/{agent_name}/{timestamp}.md."""
    agent_dir = OUTPUTS_DIR / agent_name
    agent_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    out_file = agent_dir / f"{timestamp}.md"
    out_file.write_text(result, encoding="utf-8")
    console.print(f"[dim]Result saved → {out_file}[/dim]\n")
    return out_file


def _save_manager_instructions(instructions: str) -> Path:
    """Append the test manager's delegation instructions to outputs/manager_instructions.md."""
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUTS_DIR / "manager_instructions.md"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    separator = f"\n\n---\n## Session: {timestamp}\n\n"
    with out_file.open("a", encoding="utf-8") as f:
        f.write(separator + instructions)
    console.print(f"[dim]Manager instructions saved → {out_file}[/dim]\n")
    return out_file


# ═══════════════════════════════════════════════════════════════════════════════
# Public API
# ═══════════════════════════════════════════════════════════════════════════════

async def run_single_agent(
    agent_name: str,
    prompt: str,
    cwd: str | None = None,
    max_turns: int = MAX_TURNS_SINGLE,
    model_override: str | None = None,
) -> str:
    """Run a single QA agent.

    Parameters
    ----------
    model_override:
        Name of a profile in models.yaml.  When supplied it takes precedence
        over the agent's default model and the role mapping.
    """
    from qa_ecosystem.agents import get_agent

    agent_def = get_agent(agent_name)
    profile = resolve_model(cli_override=model_override, agent_role="default")

    _print_model_banner(profile, agent_name)

    if profile.is_claude:
        result = await _run_claude_single(agent_def, prompt, profile, cwd, max_turns)
    elif profile.is_anthropic_api:
        result = await _run_anthropic_api(agent_def.prompt, prompt, profile)
    else:
        result = await _run_openai(agent_def.prompt, prompt, profile)

    _save_agent_result(agent_name, result)
    return result


async def run_orchestrator(
    prompt: str,
    cwd: str | None = None,
    max_turns: int = MAX_TURNS_ORCHESTRATED,
    model_override: str | None = None,
) -> str:
    """Run the Test Manager orchestrator.

    When the resolved model is a Claude profile the full subagent delegation
    pipeline is used.  For non-Claude profiles the orchestrator runs as a
    simple chat completion (no tool use / subagent delegation).
    """
    from qa_ecosystem.agents import get_agent, get_all_agents

    manager = get_agent("test-manager")
    profile = resolve_model(cli_override=model_override, agent_role="orchestrator")

    _print_model_banner(profile, "test-manager (orchestrator)")

    if profile.is_claude:
        result = await _run_claude_orchestrator(manager, prompt, profile, cwd, max_turns)
    elif profile.is_anthropic_api:
        console.print(
            "[yellow]Note: anthropic-api provider runs without tool use or subagent delegation. "
            "The Test Manager will produce a plan only.[/yellow]\n"
        )
        result = await _run_anthropic_api(manager.prompt, prompt, profile)
    else:
        console.print(
            "[yellow]Note: Non-Claude model selected — running orchestrator without "
            "tool use or subagent delegation. The Test Manager will produce a "
            "plan but cannot invoke specialist agents.[/yellow]\n"
        )
        result = await _run_openai(manager.prompt, prompt, profile)

    _save_manager_instructions(result)
    _save_agent_result("test-manager", result)
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# Claude Agent SDK path
# ═══════════════════════════════════════════════════════════════════════════════

async def _run_claude_single(agent_def, prompt, profile: ModelProfile, cwd, max_turns) -> str:
    from claude_agent_sdk import ClaudeAgentOptions, query

    options = ClaudeAgentOptions(
        system_prompt=agent_def.prompt,
        allowed_tools=agent_def.tools or [],
        model=profile.model_id,
        max_turns=max_turns,
        cwd=cwd or ".",
        permission_mode=DEFAULT_PERMISSION_MODE,
    )
    return await _stream_claude(prompt, options)


async def _run_claude_orchestrator(manager, prompt, profile: ModelProfile, cwd, max_turns) -> str:
    from qa_ecosystem.agents import get_all_agents
    from claude_agent_sdk import ClaudeAgentOptions, query

    subagents = get_all_agents()

    options = ClaudeAgentOptions(
        system_prompt=manager.prompt,
        allowed_tools=manager.tools or [],
        agents=subagents,
        model=profile.model_id,
        max_turns=max_turns,
        cwd=cwd or ".",
        permission_mode=DEFAULT_PERMISSION_MODE,
    )
    return await _stream_claude(prompt, options)


async def _stream_claude(prompt: str, options) -> str:
    from claude_agent_sdk import query

    collected: list[str] = []
    async for message in query(prompt=prompt, options=options):
        text = _extract_text(message)
        if text:
            collected.append(text)
            console.print(Markdown(text))
    return "\n".join(collected)


# ═══════════════════════════════════════════════════════════════════════════════
# Direct Anthropic API path
# ═══════════════════════════════════════════════════════════════════════════════

async def _run_anthropic_api(system_prompt: str, user_prompt: str, profile: ModelProfile) -> str:
    """Execute via the Anthropic Messages API directly (no Claude Code CLI required)."""
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


# ═══════════════════════════════════════════════════════════════════════════════
# OpenAI / OpenAI-compatible path
# ═══════════════════════════════════════════════════════════════════════════════

async def _run_openai(system_prompt: str, user_prompt: str, profile: ModelProfile) -> str:
    """Execute via the OpenAI Chat Completions API (works with GPT, Ollama, LM Studio, etc.)."""
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

    console.print(f"[dim]Streaming from {profile.provider}:{profile.model_id} …[/dim]\n")

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


# ═══════════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════════

def _has_question(text: str) -> bool:
    """Return True if the agent's response ends with a question."""
    # Check the last non-empty line for a question mark
    lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
    if not lines:
        return False
    return lines[-1].endswith("?")


async def _prompt_user() -> str | None:
    """Prompt the user for a reply in the terminal. Returns None if they skip."""
    console.print("\n[bold yellow]Agent is asking a question. Type your reply (or press Enter to skip):[/bold yellow]")
    loop = asyncio.get_event_loop()
    reply = await loop.run_in_executor(None, lambda: input("> ").strip())
    if not reply:
        console.print("[dim]No reply given — continuing without response.[/dim]\n")
        return None
    console.print()
    return reply


def _extract_text(message: object) -> str | None:
    """Extract printable text from a Claude Agent SDK message."""
    if hasattr(message, "result") and message.result:
        return str(message.result)
    if hasattr(message, "content") and message.content:
        parts = [block.text for block in message.content if hasattr(block, "text")]
        if parts:
            return "\n".join(parts)
    return None


def _print_model_banner(profile: ModelProfile, agent_label: str) -> None:
    """Print a short banner showing which model will be used."""
    provider_tag = {
        "claude": "Anthropic Claude",
        "openai": "OpenAI",
        "openai-compatible": "Local / Compatible",
    }.get(profile.provider, profile.provider)

    info = (
        f"[bold]{agent_label}[/bold]\n"
        f"Provider : {provider_tag}\n"
        f"Model    : {profile.model_id}\n"
        f"Profile  : {profile.name}"
    )
    if profile.api_base:
        info += f"\nEndpoint : {profile.api_base}"

    console.print(Panel(info, title="Model Config", border_style="blue", expand=False))
    console.print()


def run_sync(coro):
    """Run an async coroutine synchronously (entry point for CLI)."""
    return asyncio.run(coro)
