"""SDK adapter — provides a local AgentDefinition that works with any backend.

This module decouples agent definitions from any specific SDK (Claude Agent SDK,
GitHub Copilot SDK, etc.).  Agent files import ``AgentDefinition`` from here
instead of from an external package.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class AgentDefinition:
    """Universal agent definition compatible with Claude SDK, Copilot SDK, and OpenAI."""

    description: str
    prompt: str
    tools: list[str] | None = None
    model: str | None = None
    category: str = "planning"  # "planning" or "execution"
