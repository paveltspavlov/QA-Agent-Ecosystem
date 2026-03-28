# Input Templates

Ready-to-fill requirement files for the QA Agent Ecosystem. Copy a template, fill in the bracketed placeholders, and pass it to `qa-agent`.

## Usage

```bash
# Copy and fill a template
cp inputs/feature-testing.md inputs/my-feature.md
# Edit my-feature.md with your requirements, then:
qa-agent orchestrate -i inputs/my-feature.md
```

## Templates

| File | Workflow | Use Case |
|------|----------|----------|
| `feature-testing.md` | 1 | New feature from a PBI or user story |
| `bug-analysis.md` | 2 | Bug cluster root cause and coverage gap |
| `regression.md` | 3 | Sprint/release regression suite |
| `playwright-gen.md` | 4 | Playwright test generation from a URL |
| `flaky-tests.md` | 5 | Flaky test investigation |
| `mockup-comparison.md` | 6 | UI mockup vs implementation |
| `api-coverage.md` | 7 | API test coverage plan |
| `security-audit.md` | 8 | Security scan of the test codebase |
| `data-bootstrap.md` | 9 | Test data and fixture setup |
| `health-audit.md` | 10 | Full test health audit |
| `release-signoff.md` | 14 | Release go/no-go checklist |
| `pr-gate.md` | 18 | PR quality gate before merge |
| `smoke-verification.md` | 19 | Post-deployment smoke check |
| `single-agent.md` | -- | Run any single agent directly |
