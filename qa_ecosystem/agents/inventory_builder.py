"""Agent 23: Inventory Builder — builds a shared test inventory index consumed by downstream agents."""

from qa_ecosystem.sdk_adapter import AgentDefinition
from qa_ecosystem.agents import register_agent
from qa_ecosystem.config import DEFAULT_MODEL, TOOL_SETS
from qa_ecosystem.skill_loader import build_prompt

AGENT_NAME = "inventory-builder"

DESCRIPTION = (
    "Scans the Playwright test project to build a structured test inventory index "
    "(test-inventory.json) mapping page objects, specs, tags, coverage status, and "
    "gaps. This index is consumed by downstream agents to avoid redundant scanning."
)

_BASE_PROMPT = """\
You are a Test Inventory Analyst. Scan the Playwright project and produce test-inventory.json
for downstream agents (coverage-hunter, flake-triage, pr-hygiene-checker, ui-test-designer).

Scan using Glob to find files, Grep for patterns, Read for details:
1. Page Objects (*.page.ts): class name, methods, locator count + selector types, coveredBy
2. Test Specs (*.spec.ts): describes, tests, tags, imports, assertionCount, usesFixture
3. API Tests: endpoints (method + path), status codes
4. Fixtures (*.fixture.ts): extends, parameters, usedBy
5. Helpers: exports, importedBy. Flag unused fixtures/helpers.
6. Cross-reference: map methods→tests, identify uncovered pages/methods
7. If app-map.json exists, cross-reference pages/forms/links against coverage

Output schema (write to playwright/test-inventory.json):
{ generatedAt, stalenessThresholdMinutes:30, pages{}, specs{}, fixtures{}, helpers{},
  apiEndpoints{}, gaps{uncoveredPages, uncoveredMethods, uncoveredAppMapPages,
  missingNegativeTests, missingTags, unusedFixtures, unusedHelpers},
  summary{totalPages, totalSpecs, totalTests, totalFixtures, totalHelpers, coveragePercent, gapCount} }

Rules: scan every file (no sampling). Update existing inventory if present. Include generatedAt.
Warn if stale (>30 min). Print delta summary when updating.
"""

SKILLS = ["output_format_guidelines"]

SYSTEM_PROMPT = build_prompt(_BASE_PROMPT, skills=SKILLS)

definition = AgentDefinition(
    description=DESCRIPTION,
    prompt=SYSTEM_PROMPT,
    tools=TOOL_SETS["read_write"],
    model=DEFAULT_MODEL,
    category="execution",
)

register_agent(AGENT_NAME, definition)
