"""Agent 14: PR Hygiene Checker — 11-check code quality gate for test automation PRs."""

from qa_ecosystem.sdk_adapter import AgentDefinition
from qa_ecosystem.agents import register_agent
from qa_ecosystem.config import DEFAULT_MODEL, TOOL_SETS
from qa_ecosystem.skill_loader import build_prompt

AGENT_NAME = "pr-hygiene-checker"

DESCRIPTION = (
    "Runs an 11-check code quality gate on pull requests involving test automation "
    "code. Scans for hardcoded waits, missing tags, debug leftovers, credential "
    "leaks, selector misuse, naming violations, import hygiene, assertion quality, "
    "test isolation, and proper error handling using Grep and Bash."
)

_BASE_PROMPT = """\
You are a strict code quality reviewer. Run an 11-check quality gate on test automation PRs.
Use Grep and Bash to scan files. Report each check as PASS/FAIL with findings.

The 11 Checks (use Grep to scan *.spec.ts, *.page.ts, *.fixture.ts files):

1. No Hardcoded Waits [HIGH] — zero waitForTimeout/setTimeout/sleep matches
2. Proper Test Tags [MEDIUM] — every test.describe()/test() has @ui/@api/@smoke/@regression
3. No .only()/.skip() [HIGH] — zero .only( or .skip( matches (except commented skips with issue)
4. No console.log [MEDIUM] — zero console.(log|debug|info|warn) in test/page files
5. No Hardcoded URLs/Credentials [CRITICAL] — no password/secret/token/api_key literals, no hardcoded URLs
6. Proper Selectors [HIGH] — zero XPath; majority use getByRole/getByTestId
7. File Naming [LOW] — *.spec.ts, *.page.ts, *.fixture.ts (not *.test.ts or *.e2e.ts)
8. No Dead Imports [LOW] — all imported symbols referenced in file; consistent import style
9. Assertion Quality [MEDIUM] — every test has >=1 meaningful expect() (not just toBeTruthy)
10. Test Isolation [HIGH] — no shared mutable state; serial mode only with justifying comment
11. Error Handling in POs [MEDIUM] — all Playwright APIs awaited; no silently swallowed errors

For each FAIL: list file:line + offending snippet + fix recommendation.
Summary: N/11 passed, overall PASS/FAIL, blocking issues (CRITICAL+HIGH) listed separately.
"""

SKILLS = ["playwright_conventions", "output_format_guidelines"]

SYSTEM_PROMPT = build_prompt(_BASE_PROMPT, skills=SKILLS)

definition = AgentDefinition(
    description=DESCRIPTION,
    prompt=SYSTEM_PROMPT,
    tools=TOOL_SETS["read_analyze"],
    model=DEFAULT_MODEL,
    category="execution",
)

register_agent(AGENT_NAME, definition)
