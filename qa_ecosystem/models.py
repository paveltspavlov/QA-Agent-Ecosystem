"""Model configuration and multi-provider abstraction.

Loads model profiles from ``models.yaml`` and exposes helpers that the runner
uses to decide *how* to execute a prompt (Claude Agent SDK vs. OpenAI SDK).
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ModelProfile:
    """A single configured model endpoint."""

    name: str
    provider: str                         # "claude" | "openai" | "openai-compatible"
    model_id: str                         # e.g. "sonnet", "gpt-4o", "llama3.1"
    temperature: float = 0.4
    max_tokens: int = 16384
    api_base: str | None = None           # custom base URL (local / cloud)
    api_key_env: str | None = None        # env-var name holding the API key
    api_key_default: str | None = None    # fallback key if env-var is unset
    extra: dict[str, Any] = field(default_factory=dict)

    # -- convenience --------------------------------------------------------

    @property
    def is_claude(self) -> bool:
        return self.provider == "claude"

    @property
    def is_anthropic_api(self) -> bool:
        return self.provider == "anthropic-api"

    @property
    def is_openai(self) -> bool:
        return self.provider in ("openai", "openai-compatible")

    def resolve_api_key(self) -> str | None:
        """Return the API key from the environment, falling back to default."""
        if self.api_key_env:
            key = os.environ.get(self.api_key_env)
            if key:
                return key
        if self.is_anthropic_api:
            return os.environ.get("ANTHROPIC_API_KEY")
        return self.api_key_default


# ---------------------------------------------------------------------------
# Configuration loader
# ---------------------------------------------------------------------------

_config: dict[str, Any] | None = None
_profiles: dict[str, ModelProfile] = {}
_roles: dict[str, str] = {}


def _config_path() -> Path:
    """Return the path to models.yaml (next to this file by default)."""
    # Check for user override via env-var
    override = os.environ.get("QA_MODELS_CONFIG")
    if override:
        return Path(override)
    return Path(__file__).parent / "models.yaml"


def _ensure_loaded() -> None:
    global _config, _profiles, _roles
    if _config is not None:
        return

    path = _config_path()
    if not path.exists():
        # Sensible defaults when no config file is present
        _config = {}
        _roles = {"default": "claude-sonnet", "orchestrator": "claude-opus"}
        _profiles = {
            "claude-sonnet": ModelProfile(
                name="claude-sonnet", provider="claude", model_id="sonnet",
            ),
            "claude-opus": ModelProfile(
                name="claude-opus", provider="claude", model_id="opus",
            ),
        }
        return

    with open(path, encoding="utf-8") as f:
        _config = yaml.safe_load(f) or {}

    _roles = _config.get("roles", {"default": "claude-sonnet", "orchestrator": "claude-opus"})

    for name, raw in _config.get("profiles", {}).items():
        _profiles[name] = ModelProfile(
            name=name,
            provider=raw.get("provider", "claude"),
            model_id=raw.get("model_id", name),
            temperature=raw.get("temperature", 0.4),
            max_tokens=raw.get("max_tokens", 16384),
            api_base=raw.get("api_base"),
            api_key_env=raw.get("api_key_env"),
            api_key_default=raw.get("api_key_default"),
            extra={k: v for k, v in raw.items()
                   if k not in ("provider", "model_id", "temperature", "max_tokens",
                                "api_base", "api_key_env", "api_key_default")},
        )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_profile(name: str) -> ModelProfile:
    """Look up a model profile by name."""
    _ensure_loaded()
    if name not in _profiles:
        available = ", ".join(sorted(_profiles))
        raise KeyError(f"Unknown model profile {name!r}. Available: {available}")
    return _profiles[name]


def get_role_profile(role: str) -> ModelProfile:
    """Resolve a logical role ('default', 'orchestrator') to a ModelProfile."""
    _ensure_loaded()
    profile_name = _roles.get(role)
    if not profile_name:
        profile_name = _roles.get("default", "claude-sonnet")
    return get_profile(profile_name)


def list_profiles() -> dict[str, ModelProfile]:
    """Return all configured model profiles."""
    _ensure_loaded()
    return dict(_profiles)


def list_roles() -> dict[str, str]:
    """Return role → profile-name mapping."""
    _ensure_loaded()
    return dict(_roles)


def resolve_model(
    cli_override: str | None = None,
    agent_role: str = "default",
) -> ModelProfile:
    """Determine which model to use, with this priority:

    1. Explicit CLI ``--model`` override  (highest)
    2. Agent role mapping from models.yaml
    3. The "default" role                  (lowest)
    """
    if cli_override:
        return get_profile(cli_override)
    return get_role_profile(agent_role)


def reload() -> None:
    """Force-reload the configuration (useful after editing models.yaml)."""
    global _config
    _config = None
    _profiles.clear()
    _roles.clear()
    _ensure_loaded()
