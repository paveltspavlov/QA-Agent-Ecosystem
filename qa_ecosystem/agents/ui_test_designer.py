"""Agent 12: UI Test Designer — creates POM-based UI tests with Playwright best practices."""

from qa_ecosystem.sdk_adapter import AgentDefinition
from qa_ecosystem.agents import register_agent
from qa_ecosystem.config import DEFAULT_MODEL, TOOL_SETS
from qa_ecosystem.skill_loader import build_prompt

AGENT_NAME = "ui-test-designer"

DESCRIPTION = (
    "Creates Page Object Model-based UI tests with accessibility-first selectors "
    "and Playwright best practices including custom fixtures, auth state caching, "
    "and multi-browser configuration."
)

_BASE_PROMPT = """\
You are a senior UI test automation architect specializing in Playwright TypeScript.
Design and implement robust, maintainable test suites using POM pattern.

Bash commands: `npx playwright test`, `npx playwright test --project=chromium`,
`npx playwright codegen <url>`, `npx playwright screenshot <url> --full-page <path>`.

Multi-Browser: configure chromium/firefox/webkit projects in playwright.config.ts.
Use --shard=1/3 for CI. Browser-specific workarounds only when necessary.

Timeout Constants (shared helpers file — never hardcode numbers):
SHORT=3s, MEDIUM=5s, LONG=10s, NAVIGATION=15s.

Responsive Viewports: mobile (375×667), tablet (768×1024), desktop (1280×720).
Use test.describe() per viewport with page.setViewportSize() in beforeEach(),
or separate projects in playwright.config.ts.

Mockup Comparison (when given a mockup + live URL):
1. Screenshot each page: `npx playwright screenshot --browser chromium <url> --full-page <path>`
2. Compare layout, visual, content, functional, responsive aspects
3. Document deviations: page, expected, actual, severity (Critical/High/Medium/Low), screenshot
4. Return structured list for testware-creator bug reports

Output (code blocks MUST have filename comment on first line):
### 1. Page Objects — *.page.ts
### 2. Component Objects — *.component.ts
### 3. Fixtures — *.fixture.ts
### 4. Test Specs — *.spec.ts
### 5. Configuration — playwright.config.ts snippet if needed
### 6. Accessibility Notes
### 7. Mockup Deviations (if applicable)
"""

SKILLS = [
    "playwright_conventions",
    "auth_state_caching",
]

SYSTEM_PROMPT = build_prompt(_BASE_PROMPT, skills=SKILLS)

# Structured output schema for reliable artifact extraction
OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "files": {
            "type": "array",
            "description": "All generated code files",
            "items": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Filename e.g. login.page.ts"},
                    "type": {
                        "type": "string",
                        "enum": ["page", "component", "fixture", "spec", "config"],
                    },
                    "content": {"type": "string", "description": "Full file content"},
                },
                "required": ["path", "type", "content"],
            },
        },
        "configSnippet": {
            "type": "string",
            "description": "playwright.config.ts snippet for multi-browser/viewport setup",
        },
        "accessibilityNotes": {
            "type": "array",
            "description": "Accessibility concerns discovered during test design",
            "items": {
                "type": "object",
                "properties": {
                    "page": {"type": "string"},
                    "issue": {"type": "string"},
                    "severity": {"type": "string", "enum": ["Critical", "High", "Medium", "Low"]},
                    "recommendation": {"type": "string"},
                },
            },
        },
        "mockupDeviations": {
            "type": "array",
            "description": "Deviations found during mockup comparison (if applicable)",
            "items": {
                "type": "object",
                "properties": {
                    "page": {"type": "string"},
                    "expected": {"type": "string"},
                    "actual": {"type": "string"},
                    "severity": {"type": "string", "enum": ["Critical", "High", "Medium", "Low"]},
                    "screenshotPath": {"type": "string"},
                },
            },
        },
        "summary": {"type": "string", "description": "Summary of designed test architecture"},
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
