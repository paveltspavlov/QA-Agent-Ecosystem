"""Unit tests for qa_ecosystem/skill_loader.py — skill loading and prompt composition."""

import pytest

from qa_ecosystem.skill_loader import load_skill, build_prompt, list_skills


EXPECTED_SKILLS = [
    "auth_state_caching",
    "bug_report_format",
    "istqb_techniques",
    "output_format_guidelines",
    "page_object_model",
    "playwright_conventions",
    "playwright_selector_strategy",
    "playwright_waiting_strategy",
    "priority_ranking",
    "severity_classification",
    "test_data_factory",
]


def test_list_skills_returns_all():
    skills = list_skills()
    assert len(skills) == 11
    for expected in EXPECTED_SKILLS:
        assert expected in skills, f"Skill '{expected}' not found in list_skills()"


@pytest.mark.parametrize("skill_name", EXPECTED_SKILLS)
def test_each_skill_loads_successfully(skill_name):
    text = load_skill(skill_name)
    assert isinstance(text, str)
    assert len(text.strip()) > 20, f"Skill '{skill_name}' is suspiciously short"


def test_load_skill_unknown_raises():
    with pytest.raises(FileNotFoundError):
        load_skill("nonexistent_skill_xyz")


def test_load_skill_caches():
    """Second call should return the same object (from cache)."""
    first = load_skill("istqb_techniques")
    second = load_skill("istqb_techniques")
    assert first is second


def test_build_prompt_no_skills():
    base = "You are a test engineer."
    result = build_prompt(base)
    assert result == base.strip()


def test_build_prompt_with_skills():
    base = "You are a test engineer."
    result = build_prompt(base, skills=["istqb_techniques", "priority_ranking"])
    assert result.startswith(base.strip())
    assert "---" in result
    # Should contain content from both skills
    istqb_text = load_skill("istqb_techniques")
    priority_text = load_skill("priority_ranking")
    assert istqb_text in result
    assert priority_text in result


def test_build_prompt_empty_skills_list():
    base = "You are a test engineer."
    result = build_prompt(base, skills=[])
    assert result == base.strip()


def test_build_prompt_strips_whitespace():
    base = "   You are a test engineer.   "
    result = build_prompt(base)
    assert result == "You are a test engineer."
