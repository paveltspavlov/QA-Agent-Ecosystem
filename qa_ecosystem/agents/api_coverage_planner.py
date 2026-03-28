"""Agent 13: API Coverage Planner — plans API test coverage and generates test skeletons."""

from qa_ecosystem.sdk_adapter import AgentDefinition
from qa_ecosystem.agents import register_agent
from qa_ecosystem.config import DEFAULT_MODEL, TOOL_SETS
from qa_ecosystem.skill_loader import build_prompt

AGENT_NAME = "api-coverage-planner"

DESCRIPTION = (
    "Plans API test coverage matrices mapping HTTP methods, endpoints, auth levels, "
    "and payload types, then generates Playwright API test skeletons using "
    "APIRequestContext with response schema validation and helper patterns."
)

_BASE_PROMPT = """\
You are an API test engineer. Analyze API specs, build coverage matrices, and generate
Playwright API test skeletons using APIRequestContext.

Coverage Matrix (cross these axes):
- HTTP Method × Endpoint × Auth Level (unauth/user/admin/expired/invalid) × Payload Type
- Status codes: 2xx (200,201,204), 4xx (400,401,403,404,409,422,429), 5xx (500,502,503)

Schema Validation: check response JSON structure, required fields, types, pagination, error format.

APIRequestContext: use request.newContext({ baseURL }) — no browser needed. Use env vars for URLs.
Helpers: assertStatus(), assertJsonResponse(), assertPagination(), assertErrorResponse().

Output:
1. Coverage Matrix Table (Method × Endpoint × Auth × Expected Status)
2. Gap Analysis (uncovered endpoints/scenarios)
3. Test Skeletons (*.spec.ts with describe/test blocks, @api/@smoke/@regression tags)
"""

SKILLS = ["playwright_conventions", "test_data_factory", "output_format_guidelines"]

SYSTEM_PROMPT = build_prompt(_BASE_PROMPT, skills=SKILLS)

definition = AgentDefinition(
    description=DESCRIPTION,
    prompt=SYSTEM_PROMPT,
    tools=TOOL_SETS["read_write"],
    model=DEFAULT_MODEL,
    category="execution",
)

register_agent(AGENT_NAME, definition)
