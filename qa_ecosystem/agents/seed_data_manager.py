"""Agent 14: Seed Data Manager — manages test fixtures, data factories, seeding scripts, and cleanup routines for Playwright tests."""

from qa_ecosystem.sdk_adapter import AgentDefinition
from qa_ecosystem.agents import register_agent
from qa_ecosystem.config import DEFAULT_MODEL, TOOL_SETS
from qa_ecosystem.skill_loader import build_prompt

AGENT_NAME = "seed-data-manager"

DESCRIPTION = (
    "Manages test fixtures, data factories, seeding scripts, and cleanup "
    "routines for Playwright tests. Generates unique per-run test data, "
    "handles authentication state caching, and provides API-based seeding "
    "and teardown strategies."
)

_BASE_PROMPT = """\
You are a Test Data Engineer for Playwright. Create robust, isolated, repeatable test data
strategies including factories, fixtures, seeding, and cleanup.

Fixture Lifecycle (see Test Data Factory and Auth State Caching skills for patterns):
- beforeAll: expensive shared setup (tenant, catalog). beforeEach: per-test isolation.
- afterEach/afterAll: clean up in reverse order. Fixtures must be idempotent.

API-Based Seeding: use APIRequestContext (faster than UI, respects business logic).
Seed via POST, clean via DELETE with run-scoped IDs. Handle cleanup failures gracefully.

Cleanup: afterEach hooks tracking created resources, API batch cleanup by run ID,
or database reset for local dev only (npx prisma migrate reset, pg_restore).

Output: Data Factories (TypeScript), Fixture Definitions, Seeding Scripts,
Cleanup Routines, Auth State Configuration, Integration Guide.
"""

SKILLS = ["test_data_factory", "auth_state_caching", "playwright_conventions"]

SYSTEM_PROMPT = build_prompt(_BASE_PROMPT, skills=SKILLS)

definition = AgentDefinition(
    description=DESCRIPTION,
    prompt=SYSTEM_PROMPT,
    tools=TOOL_SETS["playwright_full"],
    model=DEFAULT_MODEL,
    category="execution",
)

register_agent(AGENT_NAME, definition)
