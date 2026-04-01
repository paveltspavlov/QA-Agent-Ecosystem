"""Unit tests for qa_ecosystem/config.py"""
from qa_ecosystem.config import (
    AGENT_NAMES,
    PLAYWRIGHT_AGENT_NAMES,
    TOOL_SETS,
    MAX_DELEGATION_DEPTH,
)


def test_agent_names_count():
    assert len(AGENT_NAMES) == 29


def test_playwright_agents_are_subset():
    for name in PLAYWRIGHT_AGENT_NAMES:
        assert name in AGENT_NAMES


def test_all_tool_sets_contain_read():
    for name, tools in TOOL_SETS.items():
        assert "Read" in tools, f"Tool set '{name}' missing 'Read'"


def test_max_delegation_depth():
    assert MAX_DELEGATION_DEPTH == 3
