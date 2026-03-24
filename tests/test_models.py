"""Unit tests for qa_ecosystem/models.py"""
import os
import pytest


def test_resolve_model_default():
    from qa_ecosystem.models import resolve_model
    profile = resolve_model()
    assert profile is not None
    assert profile.provider in ("copilot", "anthropic-api", "claude", "openai", "openai-compatible")


def test_resolve_model_cli_override():
    from qa_ecosystem.models import resolve_model
    profile = resolve_model(cli_override="copilot-gpt4o")
    assert profile.model_id == "gpt-4o"
    assert profile.provider == "copilot"


def test_unknown_profile_raises():
    from qa_ecosystem.models import get_profile
    with pytest.raises(KeyError):
        get_profile("this-profile-does-not-exist")


def test_resolve_api_key_from_env(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-12345")
    from qa_ecosystem.models import get_profile
    profile = get_profile("claude-sonnet-api")
    assert profile.resolve_api_key() == "test-key-12345"


def test_list_profiles_returns_all():
    from qa_ecosystem.models import list_profiles
    profiles = list_profiles()
    assert len(profiles) >= 10
