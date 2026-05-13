# Example Workflow: Requirements to Test Report

This example demonstrates an end-to-end orchestration workflow where the QA Manager
coordinates multiple agents to go from raw requirements to a full test execution report.

## Workflow Steps

```
1. QA Manager receives requirements (this file)
2. requirements-analyst reviews and outputs clarifying questions
3. User answers the questions, then re-runs the QA Manager with updated requirements
4. test-case-generator creates test cases from the clarified requirements
5. playwright-test-generator generates .spec.ts tests AND runs them live via `npx playwright test`
6. test-results-analyst analyzes the execution results and creates a test run report
7. bug-pattern-analyst creates a consolidated bug report for any failures found
```

## How to Run

### Step 1 — First pass (requirements analysis)

```bash
qa-agent orchestrate --input examples/workflow_requirements_to_report.md --model copilot-gpt4o
```

The QA Manager will:
1. Present its execution plan for your approval (you can edit, approve, or reject)
2. Delegate to `requirements-analyst` to review the requirements below
3. Pause via `request_human_input` to show you the clarifying questions
4. Wait for your answers

### Step 2 — Second pass (updated requirements)

After you update the requirements section below with answers to the clarifying questions:

```bash
qa-agent orchestrate --input examples/workflow_requirements_to_report.md --model copilot-gpt4o
```

The QA Manager will detect that the requirements are now clarified and proceed with:
- Test case generation
- Playwright test generation and execution
- Results analysis and reporting
- Bug report creation (if failures found)

---

## Requirements

### Feature: User Registration with Email Verification

**User Story:**
As a new user, I want to register an account using my email address so that I can access the platform.

**Acceptance Criteria:**
1. User can navigate to the registration page from the landing page
2. Registration form requires: first name, last name, email, password, confirm password
3. Password must be at least 8 characters with one uppercase, one lowercase, one number, and one special character
4. A verification email is sent upon successful form submission
5. The verification link expires after 24 hours
6. User cannot log in until email is verified
7. Duplicate email addresses are rejected with a clear error message

**Technical Notes:**
- Target URL: https://example.com (for Playwright test execution)
- Frontend: React
- Backend: REST API
- Database: PostgreSQL

**Test Scope:**
- UI registration flow (happy path + edge cases)
- Form validation (all fields)
- Error handling (duplicate email, weak password, network errors)
- Email verification flow
- Cross-browser (Chromium only for this example)

---

## Clarifications (fill in after requirements-analyst review)

_This section will be populated with answers to the requirements-analyst's clarifying questions._

<!-- Example:
Q: What happens if the user clicks the verification link after it expires?
A: They should see an "expired link" page with a button to resend the verification email.

Q: Is there a rate limit on registration attempts?
A: Yes, max 5 registration attempts per IP per hour.
-->
