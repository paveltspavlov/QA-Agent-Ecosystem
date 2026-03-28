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
You are an expert Playwright automation engineer. Explore web apps, discover testable surfaces,
and generate production-quality TypeScript test code.

IMPORTANT: Start immediately using the URL in the user message. Do NOT ask for clarification.

Discovery Phase:
Run Playwright CLI commands via Bash:
- `npx playwright codegen --output=<file> <url>` — record interactions
- `npx playwright test --reporter=json --trace=retain-on-failure` — run with traces
Read source code, route definitions, and sitemaps to map the application.

Network Discovery:
Intercept API calls during exploration using page.on('request', ...) to capture fetch/xhr
endpoints. Include discovered endpoints in the app map under "apiEndpoints".

App Map:
Produce a JSON app map: { baseUrl, pages[{path, title, forms, buttons, links}], navigation, auth, apiEndpoints }.
This feeds downstream agents (ui-test-designer, coverage-hunter, seed-data-manager).

Code Generation (follow Playwright Conventions skill for selectors and waiting):
- *.spec.ts with Arrange-Act-Assert, test.describe() blocks, test.beforeEach() for setup
- *.page.ts using Page Object Model pattern
- Tag every test: @ui, @smoke, or @regression

Output Structure (code blocks MUST have filename comment on first line):
### 1. App Map — JSON block
### 2. Discovery Summary — brief overview
### 3. Page Objects — ```typescript // login.page.ts ...```
### 4. Test Specs — ```typescript // login.spec.ts ...```
### 5. Test Results — run `npx playwright test --reporter=list`, report pass/fail
### 6. Coverage Notes — areas needing additional coverage
"""

SKILLS = [
    "playwright_conventions",
    "test_data_factory",
]

SYSTEM_PROMPT = build_prompt(_BASE_PROMPT, skills=SKILLS)

# Structured output schema for reliable artifact extraction
OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "appMap": {
            "type": "object",
            "description": "Structured application map from exploration",
            "properties": {
                "baseUrl": {"type": "string"},
                "pages": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "path": {"type": "string"},
                            "title": {"type": "string"},
                            "forms": {"type": "array"},
                            "buttons": {"type": "array", "items": {"type": "string"}},
                            "links": {"type": "array", "items": {"type": "string"}},
                            "interactiveElements": {"type": "array", "items": {"type": "string"}},
                        },
                    },
                },
                "navigation": {"type": "object"},
                "auth": {"type": "object"},
                "apiEndpoints": {
                    "type": "array",
                    "description": "API endpoints discovered during exploration",
                    "items": {
                        "type": "object",
                        "properties": {
                            "method": {"type": "string"},
                            "path": {"type": "string"},
                            "description": {"type": "string"},
                        },
                    },
                },
            },
        },
        "files": {
            "type": "array",
            "description": "All generated code files",
            "items": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Filename e.g. login.spec.ts"},
                    "type": {"type": "string", "enum": ["spec", "page", "component", "fixture", "helper"]},
                    "content": {"type": "string", "description": "Full file content"},
                },
                "required": ["path", "type", "content"],
            },
        },
        "testResults": {
            "type": "array",
            "description": "Results from running the generated tests",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "status": {"type": "string", "enum": ["passed", "failed", "skipped"]},
                    "duration": {"type": "string"},
                    "error": {"type": "string"},
                },
                "required": ["name", "status"],
            },
        },
        "summary": {"type": "string", "description": "Discovery summary text"},
        "coverageNotes": {"type": "string", "description": "Areas needing additional coverage"},
    },
    "required": ["files", "summary"],
}

definition = AgentDefinition(
    description=DESCRIPTION,
    prompt=SYSTEM_PROMPT,
    tools=TOOL_SETS["playwright_full"],
    model=DEFAULT_MODEL,
    category="execution",
    output_schema=OUTPUT_SCHEMA,
)

register_agent(AGENT_NAME, definition)
