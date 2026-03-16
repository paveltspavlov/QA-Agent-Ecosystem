"""Agent registry — central lookup for all QA agent definitions."""

from __future__ import annotations

from claude_agent_sdk import AgentDefinition

AGENT_REGISTRY: dict[str, AgentDefinition] = {}


def register_agent(name: str, definition: AgentDefinition) -> None:
    """Register an agent definition by name."""
    AGENT_REGISTRY[name] = definition


def get_agent(name: str) -> AgentDefinition:
    """Look up a single agent by name."""
    _ensure_loaded()
    if name not in AGENT_REGISTRY:
        raise KeyError(f"Unknown agent: {name!r}. Available: {list(AGENT_REGISTRY)}")
    return AGENT_REGISTRY[name]


def get_all_agents() -> dict[str, AgentDefinition]:
    """Return all agents except the orchestrator (for use as subagents)."""
    _ensure_loaded()
    return {k: v for k, v in AGENT_REGISTRY.items() if k != "test-manager"}


def list_agents() -> dict[str, AgentDefinition]:
    """Return every registered agent including the orchestrator."""
    _ensure_loaded()
    return dict(AGENT_REGISTRY)


_loaded = False


def _ensure_loaded() -> None:
    """Lazily import all agent modules so they self-register."""
    global _loaded
    if _loaded:
        return
    _loaded = True

    from qa_ecosystem.agents import (  # noqa: F401
        test_case_generator,
        requirements_analyst,
        bug_pattern_analyst,
        regression_optimizer,
        ai_test_architect,
        synthetic_data_designer,
        test_manager,
        test_oracle_creator,
        test_results_analyst,
        testware_creator,
    )
