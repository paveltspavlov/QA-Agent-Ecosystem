# Workflow 19 -- Post-Deployment Smoke Verification

Run Workflow 19 — Post-Deployment Smoke Verification.

## Deployment

- Environment: [staging | production]
- App URL: [https://staging.myapp.com]
- Deployed version: [e.g., v3.2.0]

## Critical Paths to Verify

1. Homepage loads
2. User can log in
3. [Key feature 1] is accessible
4. [Key feature 2] completes successfully

## Existing Smoke Suite

- Path: [e.g., playwright/tests/]
- Tag: [@smoke]

## Constraints

- Maximum acceptable run time: [e.g., "10 minutes"]
