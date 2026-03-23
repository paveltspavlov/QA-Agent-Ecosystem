# QA Agent Ecosystem -- Prompt Library

Quick reference of ready-to-use prompts for all 18 QA agents. Copy, paste, and fill in the bracketed placeholders.

---

## Planning Agents

### 1. test-case-generator

**Default -- comprehensive test cases from a PBI:**
> Generate comprehensive test cases for: [paste PBI/user story here]

**Technique-specific:**
> Apply [equivalence partitioning / boundary value / decision table] to: [requirement]. Variables to test: [list variables]. Expected partitions: [describe partitions or boundaries].

**Risk-based:**
> Generate high priority test cases for: [requirement]. Business impact: [high/medium/low]. Technical complexity: [high/medium/low]. Critical scenarios to cover: [list scenarios].

---

### 2. requirements-analyst

**Default -- ambiguity analysis:**
> Analyze the following PBI for clarity and completeness: [paste PBI content]. List any ambiguities, missing details, or unclear acceptance criteria.

**UI-focused:**
> Analyze the requirement and attached visual layout. Component: [component name]. Description: [requirement text]. Mockup: [describe or attach mockup]. Identify unclear or conflicting UI elements.

**Pre-refinement:**
> Help me identify ambiguities in this backlog item for upcoming refinement. Title: [title]. Description: [paste description]. Highlight missing inputs/outputs and undefined roles.

---

### 3. bug-pattern-analyst

**Default -- full bug report analysis:**
> Analyze the attached bug report data: [paste or reference bug data]. Project: [module name]. Date range: [start -- end]. Provide defect patterns, high-risk areas, and root cause categories.

**High-risk area identification:**
> Review these bug reports and identify high-risk functionalities: [paste bug data]. Focus on modules with highest defect density and recurring issues.

**Root cause analysis:**
> Examine these defects for root cause patterns: [paste bug data]. Categorize by requirements ambiguity, design flaws, implementation errors, testing gaps, and integration issues.

---

### 4. regression-optimizer

**Default -- change-based regression suite:**
> Create a regression test suite for these changes: [list changed functionalities]. Test case data: [paste or reference test suite]. Execution time budget: [hours].

**Sprint release regression:**
> Build a regression suite for Sprint [ID]. New features: [list]. Modified components: [list]. Test case data: [paste or reference test suite].

**Maintenance and cleanup:**
> Analyze existing test cases for regression suite maintenance: [paste or reference test suite]. Identify obsolete, redundant, and missing test cases.

---

### 5. ai-test-architect

**Default -- AI project test strategy:**
> Design a test strategy for this AI project. Overview: [project description]. AI use case: [classification/generation/recommendation]. EU AI Act risk category: [minimal/limited/high/unacceptable]. Key objectives: [list].

**Regulatory alignment:**
> Create a regulatory-aligned testing blueprint. Component: [name]. Regulations: [EU AI Act / SOC2 / HIPAA]. Geographic scope: [regions]. Functionality: [describe].

**Continuous validation:**
> Develop a continuous validation plan for: [system description]. AI components: [list]. Integration points: [list]. Goal: maintain performance, compliance, and ethical alignment.

---

### 6. synthetic-data-designer

**Default -- business data generation:**
> Design synthetic test data. Domain: [e-commerce / healthcare / finance]. Target features: [list]. Data types needed: [list]. Volume: [number of records]. Constraints: [list].

**API contract testing data:**
> Define synthetic test data for API integration testing. APIs: [list endpoints]. Request/response structures: [paste schemas]. Key scenarios: [list].

**Edge-case pack:**
> Create an edge-case and negative data pack for: [feature description]. Input fields: [list]. Common failures: [list known risks].

---

### 7. test-oracle-creator

**Default -- business logic expected results:**
> Generate expected results for this scenario: [describe scenario]. Business rules: [list rules]. Test data: [paste data]. Provide step-by-step validation criteria.

**API response oracle:**
> Define expected results for API test cases. Endpoint: [path]. Request payloads: [list]. Business rules: [list]. Provide expected status codes, response schemas, and error messages.

**UI behavior oracle:**
> Generate expected results for UI test cases. Page: [page name]. User actions: [list actions]. Define expected UI states, messages, and navigation outcomes per step.

---

### 8. test-results-analyst

**Default -- sprint results analysis:**
> Analyze test results from this sprint execution: [paste or reference results data]. Provide pass/fail metrics, failure patterns, flaky test identification, and recommended actions.

**Quality gate assessment:**
> Assess whether this release meets quality gate criteria. Min pass rate: [%]. Max critical failures: [number]. Test results: [paste data]. Provide go/no-go recommendation.

**Cross-sprint trend analysis:**
> Perform a quality trend analysis across sprints [range]. Data: [paste or reference]. Provide pass rate trends, recurring failures, and strategic QA recommendations.

---

### 9. testware-creator

**Default -- test plan document:**
> Create a Test Plan for project: [name]. Scope: [describe]. Test levels: [unit/integration/system/acceptance]. Timeline: [dates]. Risks: [list]. Generate an ISTQB-aligned plan.

**Test summary report:**
> Generate a Test Summary Report. Project: [name]. Cycle: [cycle name]. Execution metrics: [paste]. Key defects: [list]. Coverage: [%]. Format as a stakeholder-ready report.

**Traceability matrix:**
> Create a Traceability Matrix. Requirements: [list]. Test cases: [list]. Execution status: [paste]. Show coverage % per requirement and highlight gaps.

---

### 10. test-manager (orchestrator)

**Default -- full test cycle:**
> Orchestrate a complete test cycle. Project: [context]. Scope: [describe]. Timeline: [dates]. Team size: [number]. Break down into subtasks and assign to agents.

**Playwright generation workflow:**
> Orchestrate Playwright test generation for: [URL]. App type: [SPA/MPA/PWA]. Key user flows: [list]. Output directory: [path]. Run the full generation pipeline.

**Flake investigation workflow:**
> Investigate and resolve flaky tests. Files: [list paths]. Failure patterns: [describe]. CI logs: [paste or reference]. Deliver diagnosis and fixed test files.

---

## Playwright Execution Agents

### 11. playwright-test-generator

**Default -- full site exploration:**
> Explore [URL] and generate comprehensive Playwright TypeScript tests. Focus areas: [login, search, checkout, etc.]. Use resilient selectors and include assertions for visibility and navigation.

**Form validation tests:**
> Generate Playwright tests for form validation. URL: [URL]. Form: [describe the form]. Validation rules: [list rules]. Test valid/invalid inputs, required fields, and error messages.

**User journey tests:**
> Generate Playwright tests for a complete user journey. URL: [URL]. Journey: [describe flow from start to finish]. Role: [user role]. Include setup, teardown, and state assertions at each step.

---

### 12. ui-test-designer

**Default -- page object model generation:**
> Generate a complete Page Object Model for: [page description]. URL: [URL]. Key interactions: [list actions like login, filter, sort]. Create POM classes with selectors, action methods, and test cases.

**Visual regression tests:**
> Design visual regression tests. Pages: [list pages]. Viewports: [mobile, tablet, desktop]. Pixel threshold: [0.1]. Handle dynamic content masking and provide diff reporting.

**Responsive tests:**
> Design responsive UI tests. URL: [URL]. Breakpoints: [320, 768, 1024, 1440]. Critical elements: [list]. Verify layout, navigation menu, and touch targets at each breakpoint.

---

### 13. api-coverage-planner

**Default -- full API coverage plan:**
> Generate a comprehensive API test coverage plan. API spec: [paste or reference OpenAPI/Swagger]. Base URL: [URL]. Auth method: [Bearer/OAuth/API key]. Map all endpoints with positive and negative cases.

**Endpoint coverage matrix:**
> Build an endpoint coverage matrix. Endpoints: [list]. Methods: [GET, POST, PUT, DELETE]. Auth levels: [admin, user, anonymous]. Define expected status codes and edge-case inputs per combination.

**Error handling tests:**
> Generate test cases for API error handling. Endpoints: [list]. Expected error codes: [400, 401, 403, 404, 500]. Verify error response format, malformed payloads, and timeout behavior.

---

### 14. pr-hygiene-checker

**Default -- full 8-check quality gate:**
> Perform a full quality gate on: [list file paths]. Checks: selector resilience, assertion completeness, test isolation, naming conventions, no hardcoded waits, proper cleanup, no unjustified skips, consistent structure.

**Selector audit:**
> Audit selector quality in: [list file paths]. Flag brittle selectors (auto-generated IDs, deep CSS, XPath). Recommend data-testid or role-based replacements. Score resilience per file.

**Assertion audit:**
> Audit assertion completeness in: [list file paths]. Identify tests with no assertions, trivial checks, or missing negative assertions. Recommend improvements.

---

### 15. security-scout

**Default -- full security scan:**
> Perform a security scan of the test codebase at [project root]. Files: [list or glob]. Check for hardcoded credentials, insecure dependencies, config weaknesses, and injection vulnerabilities.

**Secrets scan:**
> Scan for exposed credentials and API keys in: [list file paths]. Report file path, line number, secret type, risk level, and remediation for each finding.

**Dependency vulnerability check:**
> Analyze project dependencies for known CVEs. Package file: [package.json path]. Lock file: [package-lock.json path]. Produce a severity-sorted summary with upgrade recommendations.

---

### 16. coverage-hunter

**Default -- full coverage audit:**
> Perform a full coverage audit. Test directory: [path]. Pages directory: [path]. Identify untested pages, uncovered functionality, and missing edge cases. Produce a coverage matrix.

**User journey coverage:**
> Evaluate test coverage for critical user journeys. Journeys: [list journey names and steps]. Test directory: [path]. Map steps to tests and identify gaps. Rank by business impact.

**Gap prioritization:**
> Prioritize coverage gaps. Coverage data: [paste or reference]. Risk criteria: [business impact, code complexity, change frequency]. Produce a ranked list with estimated effort.

---

### 17. flake-triage

**Default -- full flaky test diagnosis:**
> Diagnose the flaky test. File: [path]. Failure log: [paste log]. Investigate timing issues, race conditions, shared state, unstable selectors, and environment factors. Provide root cause and fix.

**Timing analysis:**
> Diagnose timing-related flakiness. File: [path]. Timeout errors: [paste]. Analyze hardcoded waits, missing explicit waits, animation timing, and network latency. Recommend wait strategies.

**Network race conditions:**
> Diagnose network race conditions. File: [path]. API endpoints involved: [list]. Analyze missing waitForResponse, concurrent request ordering, and retry gaps. Provide fixes using request interception.

---

### 18. seed-data-manager

**Default -- test data management plan:**
> Create a test data management plan. Data requirements: [list entities and fields]. Test scenarios: [list]. Cover factories, fixtures, cleanup, and environment considerations.

**Factory design:**
> Design test data factory functions. Entity types: [User, Order, Product, etc.]. Field specs: [list fields with types and constraints]. Provide complete factory implementations with defaults and overrides.

**Fixture setup:**
> Design Playwright fixture definitions. Requirements: [list what each fixture provides]. Test context: [describe app and auth]. Provide fixture code with proper scoping, setup, teardown, and parallelism support.
