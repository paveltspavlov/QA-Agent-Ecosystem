"""Skill loader — composes agent system prompts from reusable shared skill fragments.

Skills are markdown files stored in qa_ecosystem/skills/.
Each agent declares which skills it needs; build_prompt() injects them into the prompt.

Usage in an agent file:
    from qa_ecosystem.skill_loader import build_prompt

    BASE_PROMPT = \"\"\"You are an expert QA engineer...(agent-specific content only)\"\"\"
    SKILLS = ["playwright_selector_strategy", "playwright_waiting_strategy"]
    SYSTEM_PROMPT = build_prompt(BASE_PROMPT, skills=SKILLS)
"""

from __future__ import annotations

from pathlib import Path

_SKILLS_DIR = Path(__file__).parent / "skills"

# Cache loaded skill text to avoid repeated disk reads
_cache: dict[str, str] = {}


def load_skill(skill_name: str) -> str:
    """Load a skill fragment by name (without .md extension).

    Raises FileNotFoundError if the skill file does not exist.
    """
    if skill_name in _cache:
        return _cache[skill_name]

    skill_path = _SKILLS_DIR / f"{skill_name}.md"
    if not skill_path.exists():
        raise FileNotFoundError(
            f"Skill '{skill_name}' not found. "
            f"Expected file: {skill_path}\n"
            f"Available skills: {list_skills()}"
        )
    text = skill_path.read_text(encoding="utf-8").strip()
    _cache[skill_name] = text
    return text


def build_prompt(base_prompt: str, skills: list[str] | None = None) -> str:
    """Compose a full system prompt by appending skill fragments to the base prompt.

    Args:
        base_prompt: The agent-specific core instructions (unique to this agent).
        skills: List of skill names to append. Each skill is loaded from skills/<name>.md.

    Returns:
        The full composed system prompt string.
    """
    if not skills:
        return base_prompt.strip()

    parts = [base_prompt.strip()]
    for skill_name in skills:
        skill_text = load_skill(skill_name)
        parts.append(skill_text)

    return "\n\n---\n\n".join(parts)


def list_skills() -> list[str]:
    """Return a list of all available skill names (without .md extension)."""
    if not _SKILLS_DIR.exists():
        return []
    return sorted(p.stem for p in _SKILLS_DIR.glob("*.md"))
