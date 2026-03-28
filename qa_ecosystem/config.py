"""Central configuration for the QA Agent Ecosystem."""

# ---------------------------------------------------------------------------
# Model configuration
# ---------------------------------------------------------------------------
# Model profiles are defined in  models.yaml  (next to this file).
# Use  qa_ecosystem.models  to resolve profiles at runtime.
#
# Legacy constants kept for backward compatibility — agent modules still
# reference DEFAULT_MODEL / ORCHESTRATOR_MODEL, but the runner resolves
# the *actual* model from the profile system at execution time.
DEFAULT_MODEL = "sonnet"
ORCHESTRATOR_MODEL = "opus"

# Temperature note: The original QA Agent Ecosystem spec defines temperature
# 0.4 for all agents.  This value is stored per-profile in models.yaml AND
# kept here as a fallback.
AGENT_TEMPERATURE = 0.4

# ---------------------------------------------------------------------------
# Tool sets
# ---------------------------------------------------------------------------
TOOL_SETS: dict[str, list[str]] = {
    "read_only": ["Read", "Grep", "Glob"],
    "read_analyze": ["Read", "Grep", "Glob", "Bash"],
    "read_write": ["Read", "Grep", "Glob", "Write", "Edit"],
    "full": ["Read", "Grep", "Glob", "Write", "Edit", "Bash"],
    "orchestrator": ["Read", "Grep", "Glob", "Write", "Edit", "Bash", "Agent"],
    # Playwright execution agents — Bash is used to run `npx playwright` commands
    "playwright_full": ["Read", "Grep", "Glob", "Write", "Edit", "Bash"],
}

# Permission mode for agents that write files
DEFAULT_PERMISSION_MODE = "acceptEdits"

# Max conversation turns
MAX_TURNS_SINGLE = 25
MAX_TURNS_ORCHESTRATED = 50

# Max delegation depth to prevent infinite recursion in orchestration
MAX_DELEGATION_DEPTH = 3

# ---------------------------------------------------------------------------
# Agent names (for CLI validation)
# ---------------------------------------------------------------------------
AGENT_NAMES = [
    # Planning agents (original 10)
    "test-case-generator",
    "requirements-analyst",
    "bug-pattern-analyst",
    "regression-optimizer",
    "ai-test-architect",
    "synthetic-data-designer",
    "test-manager",
    "test-oracle-creator",
    "test-results-analyst",
    "testware-creator",
    # Playwright execution agents
    "playwright-test-generator",
    "ui-test-designer",
    "api-coverage-planner",
    "pr-hygiene-checker",
    "security-scout",
    "coverage-hunter",
    "flake-triage",
    "seed-data-manager",
    "accessibility-auditor",
    "performance-profiler",
    "api-contract-validator",
    "test-validator",
    "inventory-builder",
]

# Playwright-specific agent names (for CLI filtering)
PLAYWRIGHT_AGENT_NAMES = [
    "playwright-test-generator",
    "ui-test-designer",
    "api-coverage-planner",
    "pr-hygiene-checker",
    "security-scout",
    "coverage-hunter",
    "flake-triage",
    "seed-data-manager",
    "accessibility-auditor",
    "performance-profiler",
    "api-contract-validator",
    "test-validator",
    "inventory-builder",
]
