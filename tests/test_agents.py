"""Unit tests for qa_ecosystem/agents/ — registry and agent definitions."""

import pytest

from qa_ecosystem.config import AGENT_NAMES, TOOL_SETS
from qa_ecosystem.agents import (
    get_agent,
    get_all_agents,
    list_agents,
)
from qa_ecosystem.sdk_adapter import AgentDefinition, AgentResult


def test_all_config_agents_are_registered():
    """Every name in config.AGENT_NAMES must be in the agent registry."""
    registered = list_agents()
    for name in AGENT_NAMES:
        assert name in registered, f"Agent '{name}' listed in config but not registered"


def test_registered_count_matches_config():
    """Registry should contain exactly the same number of agents as config."""
    assert len(list_agents()) == len(AGENT_NAMES)


def test_all_agents_have_nonempty_prompt():
    for name, defn in list_agents().items():
        assert isinstance(defn.prompt, str), f"Agent '{name}' prompt is not a string"
        assert len(defn.prompt.strip()) > 50, f"Agent '{name}' has suspiciously short prompt"


def test_all_agents_have_description():
    for name, defn in list_agents().items():
        assert isinstance(defn.description, str), f"Agent '{name}' missing description"
        assert len(defn.description.strip()) > 10, f"Agent '{name}' has suspiciously short description"


def test_all_agents_have_valid_tool_set():
    """Every agent's tools list must be a subset of a known TOOL_SET."""
    all_known_tools = set()
    for tools in TOOL_SETS.values():
        all_known_tools.update(tools)

    for name, defn in list_agents().items():
        if defn.tools is None:
            continue
        for tool in defn.tools:
            assert tool in all_known_tools, (
                f"Agent '{name}' uses unknown tool '{tool}'. "
                f"Known tools: {sorted(all_known_tools)}"
            )


def test_all_agents_have_valid_category():
    for name, defn in list_agents().items():
        assert defn.category in ("planning", "execution"), (
            f"Agent '{name}' has invalid category '{defn.category}'"
        )


def test_get_all_agents_excludes_test_manager():
    """get_all_agents() should exclude the orchestrator."""
    agents = get_all_agents()
    assert "test-manager" not in agents


def test_list_agents_includes_test_manager():
    agents = list_agents()
    assert "test-manager" in agents


def test_get_agent_returns_agent_definition():
    defn = get_agent("test-case-generator")
    assert isinstance(defn, AgentDefinition)


def test_get_agent_unknown_raises():
    with pytest.raises(KeyError):
        get_agent("nonexistent-agent-xyz")


def test_planning_agents_have_planning_category():
    """All non-Playwright agents should be 'planning' category."""
    planning_names = [
        "test-case-generator", "requirements-analyst", "bug-pattern-analyst",
        "regression-optimizer", "ai-test-architect", "synthetic-data-designer",
        "test-manager", "test-oracle-creator", "test-results-analyst", "testware-creator",
    ]
    for name in planning_names:
        defn = get_agent(name)
        assert defn.category == "planning", f"Agent '{name}' should be 'planning'"


def test_execution_agents_have_execution_category():
    """All Playwright agents should be 'execution' category."""
    execution_names = [
        "playwright-test-generator", "ui-test-designer", "api-coverage-planner",
        "pr-hygiene-checker", "security-scout", "coverage-hunter",
        "flake-triage", "seed-data-manager", "accessibility-auditor",
        "performance-profiler", "api-contract-validator",
    ]
    for name in execution_names:
        defn = get_agent(name)
        assert defn.category == "execution", f"Agent '{name}' should be 'execution'"


def test_output_schema_field_defaults_to_none():
    """AgentDefinition.output_schema should default to None."""
    defn = AgentDefinition(description="test", prompt="test prompt")
    assert defn.output_schema is None


def test_output_schema_field_accepts_dict():
    """AgentDefinition.output_schema should accept a JSON Schema dict."""
    schema = {
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
            "test_cases": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["summary"],
    }
    defn = AgentDefinition(description="test", prompt="test prompt", output_schema=schema)
    assert defn.output_schema == schema
    assert defn.output_schema["required"] == ["summary"]


def test_all_agents_output_schema_is_none_or_dict():
    """If any agent sets output_schema, it must be a dict."""
    for name, defn in list_agents().items():
        assert defn.output_schema is None or isinstance(defn.output_schema, dict), (
            f"Agent '{name}' has invalid output_schema type: {type(defn.output_schema)}"
        )


# ---------------------------------------------------------------------------
# AgentResult tests
# ---------------------------------------------------------------------------

def test_agent_result_success():
    result = AgentResult(
        agent_name="test-case-generator",
        status="success",
        summary="Generated 10 test cases",
        raw_output="Full output here...",
    )
    assert result.status == "success"
    assert result.artifacts == []
    assert result.metadata == {}


def test_agent_result_with_artifacts_and_metadata():
    result = AgentResult(
        agent_name="playwright-test-generator",
        status="success",
        summary="Generated 3 test files",
        raw_output="...",
        artifacts=["tests/login.spec.ts", "tests/checkout.spec.ts"],
        metadata={"input_tokens": 1200, "output_tokens": 3400, "latency_ms": 5200},
    )
    assert len(result.artifacts) == 2
    assert result.metadata["latency_ms"] == 5200


def test_agent_result_error_status():
    result = AgentResult(
        agent_name="coverage-hunter",
        status="error",
        summary="Failed to analyze coverage",
        raw_output="Error: no test files found",
    )
    assert result.status == "error"


def test_agent_result_partial_status():
    result = AgentResult(
        agent_name="security-scout",
        status="partial",
        summary="Scanned 8/10 files, 2 unreadable",
        raw_output="Partial results...",
    )
    assert result.status == "partial"
