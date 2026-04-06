"""Claude Agent SDK execution path."""

from __future__ import annotations

from rich.console import Console
from rich.markdown import Markdown

from qa_ecosystem.config import DEFAULT_PERMISSION_MODE
from qa_ecosystem.metrics import TokenUsage
from qa_ecosystem.models import ModelProfile

console = Console()


async def run_single(agent_def, prompt, profile: ModelProfile, cwd, max_turns) -> tuple[str, TokenUsage]:
    """Execute a single agent via Claude Agent SDK."""
    try:
        from claude_agent_sdk import ClaudeAgentOptions, query  # noqa: F401
    except ImportError:
        console.print(
            "[red]The 'claude-agent-sdk' package is required for claude models.\n"
            "Install it with:  pip install claude-agent-sdk[/red]"
        )
        raise SystemExit(1)

    options = ClaudeAgentOptions(
        system_prompt=agent_def.prompt,
        allowed_tools=agent_def.tools or [],
        model=profile.model_id,
        max_turns=max_turns,
        cwd=cwd or ".",
        permission_mode=DEFAULT_PERMISSION_MODE,
    )
    return await _stream(prompt, options)


async def run_orchestrator(manager, prompt, profile: ModelProfile, cwd, max_turns) -> tuple[str, TokenUsage]:
    """Execute the orchestrator via Claude Agent SDK with subagent delegation."""
    from qa_ecosystem.agents import get_all_agents
    try:
        from claude_agent_sdk import ClaudeAgentOptions, query  # noqa: F401
    except ImportError:
        console.print(
            "[red]The 'claude-agent-sdk' package is required for claude models.\n"
            "Install it with:  pip install claude-agent-sdk[/red]"
        )
        raise SystemExit(1)

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
    return await _stream(prompt, options)


async def _stream(prompt: str, options) -> tuple[str, TokenUsage]:
    """Stream responses from the Claude Agent SDK."""
    from claude_agent_sdk import query

    collected: list[str] = []
    async for message in query(prompt=prompt, options=options):
        text = _extract_text(message)
        if text:
            collected.append(text)
            console.print(Markdown(text))
    result = "\n".join(collected)
    usage = TokenUsage(
        input_tokens=(len(options.system_prompt) + len(prompt)) // 4,
        output_tokens=len(result) // 4,
        is_estimated=True,
    )
    return result, usage


def _extract_text(message: object) -> str | None:
    """Extract printable text from a Claude Agent SDK message."""
    if hasattr(message, "result") and message.result:
        return str(message.result)
    if hasattr(message, "content") and message.content:
        parts = [block.text for block in message.content if hasattr(block, "text")]
        if parts:
            return "\n".join(parts)
    return None
