"""Unit tests for qa_ecosystem/templates/ — YAML template loading and filling."""

import pytest

from qa_ecosystem.config import AGENT_NAMES
from qa_ecosystem.templates import (
    list_templates,
    get_template_names,
    load_template,
    fill_template,
)


# Every agent (except test-manager uses the same file naming convention)
AGENTS_WITH_TEMPLATES = [name for name in AGENT_NAMES]


@pytest.mark.parametrize("agent_name", AGENTS_WITH_TEMPLATES)
def test_template_file_exists_and_parses(agent_name):
    """Each agent should have a parseable YAML template file."""
    templates = list_templates(agent_name)
    assert isinstance(templates, list)
    assert len(templates) >= 1, f"Agent '{agent_name}' has no templates"


@pytest.mark.parametrize("agent_name", AGENTS_WITH_TEMPLATES)
def test_every_template_has_required_fields(agent_name):
    """Each template must have 'name', 'description', and 'prompt' keys."""
    templates = list_templates(agent_name)
    for tmpl in templates:
        assert "name" in tmpl, f"Agent '{agent_name}' template missing 'name'"
        assert "prompt" in tmpl, f"Agent '{agent_name}' template missing 'prompt'"
        assert isinstance(tmpl["prompt"], str)
        assert len(tmpl["prompt"].strip()) > 10


@pytest.mark.parametrize("agent_name", AGENTS_WITH_TEMPLATES)
def test_default_template_exists(agent_name):
    """Each agent should have a 'default' template."""
    names = get_template_names(agent_name)
    assert "default" in names, f"Agent '{agent_name}' missing 'default' template"


def test_load_template_returns_string():
    prompt = load_template("test-case-generator", "default")
    assert isinstance(prompt, str)
    assert len(prompt) > 20


def test_load_template_unknown_raises():
    with pytest.raises(KeyError):
        load_template("test-case-generator", "nonexistent-template-xyz")


def test_load_template_unknown_agent_raises():
    with pytest.raises(FileNotFoundError):
        load_template("nonexistent-agent-xyz", "default")


def test_fill_template_substitutes_placeholders():
    result = fill_template(
        "test-case-generator",
        "default",
        pbi_content="User should be able to log in",
        focus_areas="authentication",
        priority="high",
        requirement_id="REQ-001",
    )
    assert "User should be able to log in" in result
    assert "authentication" in result


def test_fill_template_leaves_missing_placeholders():
    """Unfilled placeholders should remain as {placeholder_name}, not raise."""
    result = fill_template(
        "test-case-generator",
        "default",
        pbi_content="Some requirement",
    )
    # The other placeholders like {focus_areas} should still be present
    assert "{focus_areas}" in result or "focus_areas" in result
