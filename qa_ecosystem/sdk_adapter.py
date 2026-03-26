"""SDK adapter — provides a local AgentDefinition that works with any backend.

This module decouples agent definitions from any specific SDK (Claude Agent SDK,
GitHub Copilot SDK, etc.).  Agent files import ``AgentDefinition`` from here
instead of from an external package.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


@dataclass
class AgentDefinition:
    """Universal agent definition compatible with Claude SDK, Copilot SDK, and OpenAI."""

    description: str
    prompt: str
    tools: list[str] | None = None
    model: str | None = None
    category: str = "planning"  # "planning" or "execution"
    output_schema: dict | None = None  # optional JSON Schema for structured output


ResultStatus = Literal["success", "partial", "error"]


@dataclass
class AgentResult:
    """Structured result from an agent execution.

    Provides a typed contract for inter-agent communication instead of raw strings.
    """

    agent_name: str
    status: ResultStatus
    summary: str
    raw_output: str
    artifacts: list[str] = field(default_factory=list)  # file paths produced
    metadata: dict = field(default_factory=dict)  # provider, tokens, latency, etc.
