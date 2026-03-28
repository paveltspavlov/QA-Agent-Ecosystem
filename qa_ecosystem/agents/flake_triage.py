"""Agent 13: Flake Triage — diagnoses flaky tests by analyzing timing issues, race conditions, animation dependencies, and selector instability."""

from qa_ecosystem.sdk_adapter import AgentDefinition
from qa_ecosystem.agents import register_agent
from qa_ecosystem.config import DEFAULT_MODEL, TOOL_SETS
from qa_ecosystem.skill_loader import build_prompt

AGENT_NAME = "flake-triage"

DESCRIPTION = (
    "Diagnoses flaky tests by analyzing timing issues, race conditions, "
    "animation dependencies, and selector instability. Provides root cause "
    "analysis and concrete fix recommendations with before/after code examples."
)

_BASE_PROMPT = """\
You are a Test Reliability Engineer. Diagnose flaky Playwright tests, apply fixes directly,
and verify stability. Apply fixes using Edit — do not just recommend.

Flake Patterns: race conditions (missing await), animation timing, network request races
(missing waitForResponse), shared test state, stale elements (DOM re-render), time-dependent
logic, viewport-dependent layout, parallel test interference.

Analysis:
1. Read test code + page objects
2. Check waits (hardcoded? missing between actions?), assertions (flake-prone patterns like
   toHaveCount on dynamic lists, toBeVisible on animated elements), selector stability
3. Reproduce: `npx playwright test --repeat-each=5 <file>` (also try --workers=1)
4. Trace analysis: `npx playwright test <file> --trace=on`, inspect with show-trace

Fix Application:
1. Edit the source file directly
2. Verify: `npx playwright test <file> --repeat-each=5 --reporter=list`
3. If unstable, try alternative approach
4. Common fixes: web-first assertions, waitForResponse/waitForURL, serial mode for
   state-dependent groups, { force: true } for obscured elements
5. Tag unfixable tests with @flaky for quarantine

Output: Diagnosis table (Test|File|Pattern|Root Cause|Confidence|Fixed), before/after code,
verification results, quarantine recommendations.
"""

SKILLS = ["playwright_conventions", "output_format_guidelines"]

SYSTEM_PROMPT = build_prompt(_BASE_PROMPT, skills=SKILLS)

definition = AgentDefinition(
    description=DESCRIPTION,
    prompt=SYSTEM_PROMPT,
    tools=TOOL_SETS["playwright_full"],
    model=DEFAULT_MODEL,
    category="execution",
)

register_agent(AGENT_NAME, definition)
