"""Agent registry — central lookup for all QA agent definitions."""

from __future__ import annotations

from qa_ecosystem.sdk_adapter import AgentDefinition

AGENT_REGISTRY: dict[str, AgentDefinition] = {}


def register_agent(name: str, definition: AgentDefinition) -> None:
    """Register an agent definition by name."""
    AGENT_REGISTRY[name] = definition


def _with_session(definition: AgentDefinition) -> AgentDefinition:
    """Inject the active session paths into a fresh copy of the definition.

    No-op if no session has been initialized yet — callers that haven't gone
    through the runner (e.g. tests, lookups) get the raw template.
    """
    from dataclasses import replace as _dc_replace
    try:
        from qa_ecosystem import session as _session
        if _session._session_dir is None:
            return definition
        from qa_ecosystem.runner import _inject_session_paths
    except Exception:
        return definition
    return _dc_replace(definition, prompt=_inject_session_paths(definition.prompt))


def get_agent(name: str) -> AgentDefinition:
    """Look up a single agent by name with session paths injected."""
    _ensure_loaded()
    if name not in AGENT_REGISTRY:
        raise KeyError(f"Unknown agent: {name!r}. Available: {list(AGENT_REGISTRY)}")
    return _with_session(AGENT_REGISTRY[name])


def get_all_agents() -> dict[str, AgentDefinition]:
    """Return all agents except the orchestrator (for use as subagents)."""
    _ensure_loaded()
    return {k: _with_session(v) for k, v in AGENT_REGISTRY.items() if k != "test-manager"}


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
        # Playwright execution agents
        playwright_test_generator,
        ui_test_designer,
        api_coverage_planner,
        pr_hygiene_checker,
        security_scout,
        coverage_hunter,
        flake_triage,
        seed_data_manager,
        accessibility_auditor,
        performance_profiler,
        api_contract_validator,
        test_validator,
        inventory_builder,
        # Exploratory testing agents
        exploratory_tester,
        playwright_recorder,
        playwright_executor,
        # Copilot bridge + reporting agents
        playwright_copilot_bridge,
        bug_reporter,
        report_creator,
    )
