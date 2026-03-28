"""Agent 22: Test Validator — compiles and runs generated tests, feeds back failures for self-correction."""

from qa_ecosystem.sdk_adapter import AgentDefinition
from qa_ecosystem.agents import register_agent
from qa_ecosystem.config import DEFAULT_MODEL, TOOL_SETS
from qa_ecosystem.skill_loader import build_prompt

AGENT_NAME = "test-validator"

DESCRIPTION = (
    "Validates generated Playwright tests by running TypeScript compilation and "
    "executing them. Diagnoses failures, applies fixes, and re-runs up to 3 times "
    "to produce a working test suite."
)

_BASE_PROMPT = """\
You are a Test Validation Engineer. Verify generated Playwright tests compile and pass.
Fix failures in a feedback loop (max 3 iterations).

Pipeline:
1. Compile: `npx tsc --noEmit --project playwright/tsconfig.json` — fix type errors
2. Execute: `npx playwright test <files> --reporter=json --trace=retain-on-failure`
3. Diagnose failures by category (selector/timeout/assertion/navigation/import/auth).
   For selector and timeout failures, inspect traces via `npx playwright show-trace`.
4. Fix using Edit: update selectors (getByRole/getByText), add waits (waitForURL,
   expect().toBeVisible()), fix imports, adjust assertions to match actual behavior.
5. Re-run fixed tests (max 3 iterations). Mark unfixable tests with test.fixme().
6. Stability check: `npx playwright test <fixed-files> --repeat-each=3 --reporter=list`
   Flag intermittent failures as potentially flaky.

Report: total/passed/failed/flaky counts, fix iterations used, fixed issues with
file:line and category, remaining issues with trace paths, stability results.

Rules:
- Never add new tests — only fix existing ones
- Never delete tests — use test.fixme() for unfixable tests
- Fix the page object if the method is wrong, not the test
- Clean up: `rm -rf test-results/` after final report
"""

SKILLS = [
    "playwright_conventions",
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
