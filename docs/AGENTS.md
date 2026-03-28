# Agent Reference

All 21 agents in the QA Agent Ecosystem.

## Agent Table

| # | Agent | Category | Purpose |
|---|-------|----------|---------|
| 1 | `test-case-generator` | Planning | ISTQB test cases from PBIs |
| 2 | `requirements-analyst` | Planning | PBI ambiguity detection and gap analysis |
| 3 | `bug-pattern-analyst` | Planning | Bug report pattern and trend analysis |
| 4 | `regression-optimizer` | Planning | Optimized regression suites |
| 5 | `ai-test-architect` | Planning | AI/ML test strategy and compliance |
| 6 | `synthetic-data-designer` | Planning | Privacy-safe test data design |
| 7 | `test-manager` | Planning | Orchestrator with 20+ workflows |
| 8 | `test-oracle-creator` | Planning | Expected results and validation rules |
| 9 | `test-results-analyst` | Planning | Test execution analysis and failure trends |
| 10 | `testware-creator` | Planning | Professional QA documentation |
| 11 | `playwright-test-generator` | Execution | Generate Playwright TypeScript tests |
| 12 | `ui-test-designer` | Execution | POM-based UI tests, accessibility selectors |
| 13 | `api-coverage-planner` | Execution | API test coverage matrix |
| 14 | `pr-hygiene-checker` | Execution | 11-check code quality gate |
| 15 | `security-scout` | Execution | Secrets and vulnerability scanning |
| 16 | `coverage-hunter` | Execution | Test coverage gap analysis |
| 17 | `flake-triage` | Execution | Flaky test diagnosis, fix, and verification |
| 18 | `seed-data-manager` | Execution | Test data factories and fixtures |
| 19 | `accessibility-auditor` | Execution | WCAG 2.1 AA compliance audits via axe-core |
| 20 | `performance-profiler` | Execution | Core Web Vitals and page load profiling |
| 21 | `api-contract-validator` | Execution | OpenAPI spec validation and breaking change detection |

Each agent has **5 prompt templates**. View them with:

```bash
qa-agent list-templates --agent <agent-name>
```

---

## Planning Agents (1--10)

Planning agents analyze requirements, generate test cases, optimize suites, and produce QA documentation. They do not interact with the Playwright framework directly.

| Agent | Skills Used |
|-------|-------------|
| `test-case-generator` | `istqb_techniques`, `priority_ranking`, `output_format_guidelines` |
| `requirements-analyst` | `priority_ranking`, `output_format_guidelines` |
| `bug-pattern-analyst` | `severity_classification`, `bug_report_format`, `output_format_guidelines` |
| `regression-optimizer` | `istqb_techniques`, `priority_ranking`, `output_format_guidelines` |
| `ai-test-architect` | `istqb_techniques`, `priority_ranking`, `output_format_guidelines` |
| `synthetic-data-designer` | `output_format_guidelines` |
| `test-manager` | `priority_ranking`, `severity_classification`, `output_format_guidelines` |
| `test-oracle-creator` | `output_format_guidelines` |
| `test-results-analyst` | `priority_ranking`, `severity_classification`, `output_format_guidelines` |
| `testware-creator` | `bug_report_format`, `output_format_guidelines` |

---

## Playwright Execution Agents (11--21)

Execution agents generate, validate, and analyze Playwright TypeScript tests. They have access to file tools and the Playwright CLI.

| Agent | Skills Used | Tool Set |
|-------|-------------|----------|
| `playwright-test-generator` | `playwright_conventions`, `test_data_factory`, `output_format_guidelines` | `playwright_full` |
| `ui-test-designer` | `playwright_conventions`, `auth_state_caching`, `output_format_guidelines` | `playwright_full` |
| `api-coverage-planner` | `playwright_conventions`, `test_data_factory`, `output_format_guidelines` | `read_write` |
| `pr-hygiene-checker` | `playwright_conventions`, `output_format_guidelines` | `read_analyze` |
| `security-scout` | `severity_classification`, `output_format_guidelines` | `read_analyze` |
| `coverage-hunter` | `output_format_guidelines` | `read_analyze` |
| `flake-triage` | `playwright_conventions`, `output_format_guidelines` | `playwright_full` |
| `seed-data-manager` | `test_data_factory`, `auth_state_caching`, `playwright_conventions` | `playwright_full` |
| `accessibility-auditor` | `severity_classification`, `output_format_guidelines` | `playwright_full` |
| `performance-profiler` | `severity_classification`, `output_format_guidelines` | `playwright_full` |
| `api-contract-validator` | `severity_classification`, `output_format_guidelines` | `read_analyze` |

---

## Playwright Agent Improvements (v2.1)

- **Flake triage now applies fixes** -- upgraded from read-only to full Playwright tools. Diagnoses flakes, applies fixes directly, and verifies stability with `--repeat-each=5`. Added trace analysis and 2 new flake patterns (viewport-dependent layout, parallel test interference).
- **Trace-based debugging in test-validator** -- runs tests with `--trace=retain-on-failure`, uses traces to diagnose selector/timeout failures, and runs a stability check (`--repeat-each=3`) on fixed tests to catch flakiness early.
- **Structured output schema for ui-test-designer** -- enables reliable artifact extraction from ui-test-designer output (page objects, components, fixtures, specs). Added responsive viewport testing guidance (mobile/tablet/desktop breakpoints).
- **11-check PR quality gate** -- expanded from 8 to 11 checks with new assertion quality (CHECK 9), test isolation (CHECK 10), and proper error handling in page objects (CHECK 11).
- **Inventory builder tracks fixtures and helpers** -- scans `fixtures/` and `helpers/` directories, detects unused fixtures/helpers, tracks staleness with threshold warnings, and supports delta mode for incremental updates.
- **Network API discovery in playwright-test-generator** -- generates a discovery script that intercepts `fetch`/`xhr` requests during exploration to capture API endpoints.
- **Fixture and helper file extraction** -- output parser now extracts `*.fixture.ts` and helper files from agent output into the structured session directory.
- **Expanded playwright-gen workflow** -- added accessibility-auditor (step 9) and performance-profiler (step 10) to the `playwright-gen` workflow, running in parallel after discovery.
