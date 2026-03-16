"""Template loader — reads YAML prompt templates for each agent."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

TEMPLATES_DIR = Path(__file__).parent

_cache: dict[str, list[dict[str, str]]] = {}


def _load_yaml(agent_name: str) -> list[dict[str, str]]:
    """Load and cache templates from a YAML file."""
    if agent_name in _cache:
        return _cache[agent_name]

    path = TEMPLATES_DIR / f"{agent_name.replace('-', '_')}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"No template file for agent {agent_name!r} at {path}")

    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    templates = data.get("templates", [])
    _cache[agent_name] = templates
    return templates


def list_templates(agent_name: str) -> list[dict[str, str]]:
    """Return all templates for an agent as a list of {name, description, prompt}."""
    return _load_yaml(agent_name)


def get_template_names(agent_name: str) -> list[str]:
    """Return just the template names for an agent."""
    return [t["name"] for t in _load_yaml(agent_name)]


def load_template(agent_name: str, template_name: str = "default") -> str:
    """Load a specific template's prompt string."""
    for t in _load_yaml(agent_name):
        if t["name"] == template_name:
            return t["prompt"]
    available = get_template_names(agent_name)
    raise KeyError(
        f"Template {template_name!r} not found for {agent_name!r}. "
        f"Available: {available}"
    )


def fill_template(
    agent_name: str,
    template_name: str = "default",
    **kwargs: str,
) -> str:
    """Load a template and substitute placeholders with provided values.

    Placeholders use Python str.format_map style: {pbi_content}, {bug_data}, etc.
    Missing placeholders are left as-is (no KeyError).
    """
    raw = load_template(agent_name, template_name)

    class SafeDict(dict):
        def __missing__(self, key: str) -> str:
            return "{" + key + "}"

    return raw.format_map(SafeDict(**kwargs))
