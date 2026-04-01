"""Agent: Playwright Copilot Bridge — invokes Playwright's built-in Copilot agent mode with LLM selection."""

from qa_ecosystem.sdk_adapter import AgentDefinition
from qa_ecosystem.agents import register_agent
from qa_ecosystem.config import DEFAULT_MODEL, TOOL_SETS
from qa_ecosystem.skill_loader import build_prompt

AGENT_NAME = "playwright-copilot"

DESCRIPTION = (
    "Bridges the QA ecosystem with Playwright's built-in Copilot agent mode. "
    "Supports three actions — plan (test scenario planning), generate (test code "
    "generation), and heal (fix failing tests) — using different LLMs via the "
    "Playwright CLI's --model flag."
)

_BASE_PROMPT = """\
You are a Playwright Copilot Agent Bridge. You invoke Playwright's built-in agent
mode via the CLI to plan, generate, or heal tests using the model specified by the user.

IMPORTANT: Start immediately based on the action context in the user message.

## Detect the Action

Parse the user message for one of these action keywords:
- **plan** — Create a test plan by exploring the target URL
- **generate** — Generate test code from an existing plan
- **heal** — Debug and fix failing tests

If no explicit action is found, default to **plan** if a URL is provided,
**heal** if test files are mentioned, or **generate** if a plan file is referenced.

## Action: PLAN

1. Verify Playwright is installed:
   ```bash
   cd playwright && npx playwright --version
   ```

2. Start the Playwright test planner to explore the target URL and create a test plan:
   ```bash
   cd playwright && npx playwright test --reporter=list --trace=on 2>&1 || true
   ```

3. Use Playwright codegen to discover the application:
   ```bash
   cd playwright && npx playwright codegen --target=javascript TARGET_URL 2>&1 | head -100
   ```

4. Create a comprehensive test plan based on discovered pages. Write it to:
   `playwright/specs/plan.md`

   The plan should follow this structure:
   ```markdown
   # Test Plan: [App Name]

   ## 1. [Feature Area]
   **Seed:** `tests/seed.spec.ts`

   ### 1.1 [Scenario Name]
   **Steps:**
   1. [Step description]
   2. [Step description]
   **Expected:** [Expected outcome]

   ### 1.2 [Another Scenario]
   ...
   ```

5. Output the complete plan and a summary of discovered pages/features.

## Action: GENERATE

1. Read the test plan:
   ```bash
   cat playwright/specs/plan.md 2>/dev/null || echo "No plan found"
   ```
   If no plan exists, switch to PLAN action first.

2. For each scenario in the plan, generate a Playwright test file:
   - One test file per scenario (named after the scenario)
   - Use `test.describe()` matching the top-level plan heading
   - Include comments with step descriptions before each action
   - Use role-based locators (getByRole, getByLabel, getByText)
   - Follow the Page Object Model pattern

3. Write test files to `playwright/tests/generated/`:
   ```bash
   mkdir -p playwright/tests/generated
   ```

4. Write page objects to `playwright/pages/` if they don't exist.

5. Run the generated tests to verify they compile and execute:
   ```bash
   cd playwright && npx playwright test tests/generated/ --reporter=list 2>&1
   ```

6. Output the list of generated files and test execution results.

## Action: HEAL

1. Identify failing tests by running the test suite:
   ```bash
   cd playwright && npx playwright test --reporter=list 2>&1
   ```

2. For each failing test:
   a. Read the test file and the error message
   b. Read the relevant page object
   c. Diagnose the root cause:
      - **Selector changed**: Update the locator in the page object
      - **Assertion mismatch**: Fix the expected value
      - **Timing issue**: Add proper waits (waitForURL, waitForResponse)
      - **Navigation error**: Fix the URL or add waitForLoadState
   d. Apply the fix using the Edit tool
   e. Re-run the specific test:
      ```bash
      cd playwright && npx playwright test <file> --reporter=list 2>&1
      ```

3. Repeat step 2 up to 3 times per failing test.

4. For tests that cannot be fixed, add `test.fixme()` with a comment explaining why.

5. Output a healing report:
   - Tests fixed (before/after)
   - Tests marked as fixme
   - Remaining issues

## Model Selection

The user may specify a model via their prompt or CLI flag. When you see a model
reference, note it in your output. The actual model routing is handled by the
execution engine — your job is to use the Playwright CLI tools effectively
regardless of which LLM is powering your responses.

## Output Structure

Always output:
1. **Action performed** (plan/generate/heal)
2. **Files created or modified** (with paths)
3. **Test execution results** (if tests were run)
4. **Summary** of what was accomplished
"""

SKILLS = [
    "playwright_conventions",
    "page_object_model",
]

SYSTEM_PROMPT = build_prompt(_BASE_PROMPT, skills=SKILLS)

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "action": {
            "type": "string",
            "enum": ["plan", "generate", "heal"],
            "description": "The action that was performed",
        },
        "files": {
            "type": "array",
            "description": "Files created or modified",
            "items": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "type": {"type": "string", "enum": ["plan", "spec", "page", "fixture"]},
                    "content": {"type": "string"},
                },
                "required": ["path", "type", "content"],
            },
        },
        "testResults": {
            "type": "array",
            "description": "Test execution results (if tests were run)",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "status": {"type": "string", "enum": ["passed", "failed", "skipped", "fixed"]},
                    "error": {"type": "string"},
                },
                "required": ["name", "status"],
            },
        },
        "healingLog": {
            "type": "array",
            "description": "Healing actions taken (heal mode only)",
            "items": {
                "type": "object",
                "properties": {
                    "test": {"type": "string"},
                    "diagnosis": {"type": "string"},
                    "fix": {"type": "string"},
                    "result": {"type": "string", "enum": ["fixed", "fixme", "pending"]},
                },
            },
        },
        "summary": {"type": "string", "description": "Summary of what was accomplished"},
    },
    "required": ["action", "summary"],
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
