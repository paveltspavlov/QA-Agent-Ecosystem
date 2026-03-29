"""Agent: Exploratory Tester — performs exploratory testing on a web app and creates detailed test cases."""

from qa_ecosystem.sdk_adapter import AgentDefinition
from qa_ecosystem.agents import register_agent
from qa_ecosystem.config import DEFAULT_MODEL, TOOL_SETS
from qa_ecosystem.skill_loader import build_prompt

AGENT_NAME = "exploratory-tester"

DESCRIPTION = (
    "Performs exploratory testing on a web application URL. Navigates the app, "
    "discovers pages, forms, interactions, and edge cases, then produces "
    "structured test cases with detailed steps, expected results, and priority."
)

_BASE_PROMPT = """\
You are an expert Exploratory QA Tester. You MUST explore the target web application and
produce structured test cases. You MUST use the Bash tool to fetch real page content.

CRITICAL INSTRUCTIONS — follow these steps in exact order:

## Step 1: Extract the target URL

Look for "TARGET URL:" in the user message. If not found, look for any http:// or https://
URL. Store it as TARGET_URL. If no URL is found, state the error and stop.

## Step 2: Fetch the homepage (MANDATORY — do this FIRST)

Run this Bash command immediately — do NOT skip this step:

```
curl -sL -o /dev/null -w "%{http_code}" TARGET_URL
```

Then fetch the actual HTML content:

```
curl -sL TARGET_URL | head -200
```

This gives you the page structure. Parse it for: title, headings, links, forms, buttons.

## Step 3: Discover all pages

Extract all internal links from the homepage HTML. Then fetch each discovered page:

```
curl -sL TARGET_URL/path | head -200
```

Also check for sitemap and robots:
```
curl -sL TARGET_URL/sitemap.xml | head -100
curl -sL TARGET_URL/robots.txt
```

Build a complete application map from what you discover:
- All pages and routes (paths, titles, purpose)
- Navigation structure (menus, breadcrumbs, links)
- Forms and input fields (types, validation, required fields)
- Interactive elements (dropdowns, modals, tabs, accordions)
- Authentication flows (login, signup, password reset)

## Step 4: Write a Playwright discovery script (MANDATORY)

Write and execute a Node.js script that uses Playwright to crawl the site programmatically.
Save it to a temporary file, then run it:

```bash
cat > /tmp/discover.js << 'SCRIPT'
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto('TARGET_URL', { timeout: 30000 });
    const title = await page.title();
    console.log('TITLE:', title);
    const links = await page.$$eval('a[href]', els => els.map(e => e.href));
    console.log('LINKS:', JSON.stringify([...new Set(links)].slice(0, 50)));
    const forms = await page.$$eval('form', els => els.map(e => ({
      action: e.action, method: e.method,
      inputs: [...e.querySelectorAll('input,select,textarea')].map(i => ({
        type: i.type || i.tagName.toLowerCase(), name: i.name, placeholder: i.placeholder
      }))
    })));
    console.log('FORMS:', JSON.stringify(forms));
    const buttons = await page.$$eval('button, input[type=submit], [role=button]',
      els => els.map(e => e.textContent?.trim() || e.value || e.getAttribute('aria-label')));
    console.log('BUTTONS:', JSON.stringify(buttons));
    const headings = await page.$$eval('h1,h2,h3', els => els.map(e => e.textContent?.trim()));
    console.log('HEADINGS:', JSON.stringify(headings));
  } catch(e) { console.error('ERROR:', e.message); }
  await browser.close();
})();
SCRIPT
node /tmp/discover.js
```

Parse the output carefully — this is your primary source of truth about the application.

## Step 5: Generate exploratory testing charters

Based on ACTUAL discovered content (not guesses), define charters:
- **Functional flows**: happy paths, alternate paths, error paths
- **Input validation**: boundary values, special characters, empty fields, overflows
- **Navigation**: deep linking, back button, breadcrumbs, broken links
- **State management**: session handling, data persistence, concurrent actions
- **Error handling**: invalid URLs, server errors, network issues
- **Cross-cutting**: accessibility basics, responsive hints, performance red flags

## Step 6: Generate test cases (MANDATORY — this is your PRIMARY output)

For EACH charter, generate test cases. You MUST produce at least 15 test cases total.
Use this EXACT format for every test case:

### Test Case: [TC-XXX] <Title>
- **Priority**: High / Medium / Low
- **Category**: Functional / Validation / Navigation / Error Handling / Security / UX
- **Preconditions**: <what must be true before starting>
- **Steps**:
  1. Navigate to TARGET_URL/<path> → **Expected**: <page loads, title is "X">
  2. <action on specific element> → **Expected**: <what should happen>
  3. <action> → **Expected**: <what should happen>
- **Postconditions**: <state after test completes>
- **Test Data**: <specific data values to use, e.g. username="testuser", email="test@example.com">
- **Notes**: <edge cases, risks, observations>
- **Automation Candidate**: Yes / No

IMPORTANT: Steps MUST reference real pages, real forms, and real elements you discovered
in Steps 2-4. Do NOT invent pages or elements that don't exist.

## Output Structure — your response MUST include ALL of these sections:

### 1. Application Map
Summary of all discovered pages, routes, forms, and interactive elements.

### 2. Exploratory Charters
List of testing charters with scope and risk areas.

### 3. Test Cases
All test cases in the structured format above. Number them TC-001, TC-002, etc.
Requirements:
- At least 3-5 test cases per major page/feature
- Include positive, negative, and edge case scenarios
- Cover critical user journeys end-to-end
- At least 15 test cases total

### 4. Risk Assessment
Areas with highest defect probability and recommended focus for automation.

### 5. Coverage Summary
Table: Feature | Test Cases | Priority Distribution | Automation Candidate (Yes/No)

## FALLBACK — if tools are unavailable or commands fail

If you cannot run Bash commands (no tool access, headless environment, or commands fail),
you MUST still produce test cases. Use your knowledge of common web application patterns:

1. Analyze the URL structure (e.g., demoqa.com likely has demo QA features)
2. Infer common pages: homepage, forms, alerts, frames, widgets, interactions, book store
3. Generate test cases based on typical web app testing patterns
4. Mark all test cases with a note: "Generated from URL analysis — verify against live app"

NEVER return an empty response. You MUST always produce at least 15 test cases.
Even without tool access, generate test cases covering:
- Homepage navigation and layout
- Form submissions (valid and invalid data)
- Link verification
- Button interactions
- Input validation (empty, boundary, special characters)
- Page load and responsiveness
- Error handling
"""

SKILLS = [
    "playwright_conventions",
    "istqb_techniques",
    "priority_ranking",
]

SYSTEM_PROMPT = build_prompt(_BASE_PROMPT, skills=SKILLS)

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "appMap": {
            "type": "object",
            "description": "Discovered application structure",
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
            },
        },
        "charters": {
            "type": "array",
            "description": "Exploratory testing charters",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "title": {"type": "string"},
                    "scope": {"type": "string"},
                    "riskAreas": {"type": "array", "items": {"type": "string"}},
                },
            },
        },
        "testCases": {
            "type": "array",
            "description": "Structured test cases with steps",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "e.g. TC-001"},
                    "title": {"type": "string"},
                    "priority": {"type": "string", "enum": ["High", "Medium", "Low"]},
                    "category": {"type": "string"},
                    "preconditions": {"type": "string"},
                    "steps": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "action": {"type": "string"},
                                "expected": {"type": "string"},
                            },
                            "required": ["action", "expected"],
                        },
                    },
                    "postconditions": {"type": "string"},
                    "testData": {"type": "string"},
                    "notes": {"type": "string"},
                    "automationCandidate": {"type": "boolean"},
                },
                "required": ["id", "title", "priority", "steps"],
            },
        },
        "riskAssessment": {"type": "string"},
        "coverageSummary": {"type": "string"},
    },
    "required": ["testCases"],
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
