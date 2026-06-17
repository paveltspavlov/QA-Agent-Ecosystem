# Current Task — Requirements

## Objective

Test the Multi-Factor Authentication (MFA) feature for user login (PBI-1042) end-to-end, from requirements validation to test planning and data strategy.

## Feature Overview: User Login with Multi-Factor Authentication (MFA)

**User Story:** As a registered user, I want to log in with multi-factor authentication so that my account is protected from unauthorized access.

### MFA Methods
- **TOTP** — Time-based one-time password via authenticator app (30-second validity, 6 digits)
- **SMS** — One-time code via Twilio (5-minute validity, 6 digits)
- **Email** — One-time code via email (5-minute validity, 6 digits)

### Acceptance Criteria
1. Users can enable/disable MFA from account settings
2. When MFA enabled, post-credential entry prompts for second factor
3. TOTP codes: 6 digits, valid for 30 seconds
4. SMS/Email codes: 6 digits, valid for 5 minutes
5. After 3 failed MFA attempts, session locked for 15 minutes
6. Organization admins can enforce MFA for all members
7. Users can generate 8 backup recovery codes (one-time use each)
8. Login flow completes within 2 seconds (excluding user input)

### Technical Stack
- Backend: Node.js / Express REST API
- Auth: JWT with refresh tokens
- Database: PostgreSQL
- SMS Provider: Twilio
- Existing auth middleware: `/src/middleware/auth.js`

## Inputs & Constraints

- **Scope:** Full MFA feature (optional user-level + admin enforcement)
- **Risk Areas:** Session locking after 3 failures, rate limiting, token validity, recovery codes, admin enforcement logic
- **Test Constraints:** No real phone numbers; use synthetic test data for SMS/Email verification
- **Security Sensitivity:** High (auth critical path, account takeover risk)

## Preferred Workflow

`feature-testing` — End-to-end test design for new feature
