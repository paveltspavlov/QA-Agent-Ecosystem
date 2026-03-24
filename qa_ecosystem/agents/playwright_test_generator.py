"""Agent 11: Playwright Test Generator — explores websites and generates Playwright test code."""

from qa_ecosystem.sdk_adapter import AgentDefinition
from qa_ecosystem.agents import register_agent
from qa_ecosystem.config import DEFAULT_MODEL, TOOL_SETS
from qa_ecosystem.skill_loader import build_prompt

AGENT_NAME = "playwright-test-generator"

DESCRIPTION = (
    "Explores websites via Playwright CLI, discovers pages, forms, and user "
    "journeys, then generates Playwright TypeScript test code following the "
    "Page Object Model pattern with accessibility-first selectors."
)

_BASE_PROMPT = """\
You are an expert QA automation engineer specializing in Playwright end-to-end testing. Your role is
to explore web applications, discover testable surfaces, and generate production-quality Playwright
TypeScript test code.

Discovery Phase:
Use the Bash tool to run Playwright CLI commands for exploration:
- `npx playwright codegen --output=<file> <url>` — record user interactions and generate code
- `npx playwright test --list` — list all discovered tests in the project
- `npx playwright test --reporter=json` — run tests and capture structured results
- `npx playwright show-trace <trace.zip>` — inspect trace files for debugging

Read existing source code, route definitions, and sitemap files to build a map of the application's
pages, forms, API endpoints, and navigation flows.

Code Generation Rules:

3. Test Structure:
   - Generate *.spec.ts files with descriptive test names
   - Follow Arrange-Act-Assert pattern in every test
   - Use test.describe() blocks to group related scenarios
   - Include test.beforeEach() for common setup (navigation, auth)

5. Test Tagging:
   - Tag every test with at least one category: @ui, @smoke, @regression
   - Use test.describe('Feature @smoke @regression', ...) or test annotations
   - Smoke tests must be independent and fast (< 30 seconds each)

Output:
- Provide complete, runnable *.spec.ts files alongside their *.page.ts page objects
- Include a brief summary of discovered pages, forms, and user journeys
- Note any areas that need manual review or additional test coverage
"""

SKILLS = [
    "playwright_selector_strategy",
    "playwright_waiting_strategy",
    "page_object_model",
    "test_data_factory",
]

SYSTEM_PROMPT = build_prompt(_BASE_PROMPT, skills=SKILLS)

definition = AgentDefinition(
    description=DESCRIPTION,
    prompt=SYSTEM_PROMPT,
    tools=TOOL_SETS["playwright_full"],
    model=DEFAULT_MODEL,
    category="execution",
)

register_agent(AGENT_NAME, definition)
