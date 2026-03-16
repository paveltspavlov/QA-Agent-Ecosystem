# PBI-1042: User Login with Multi-Factor Authentication (MFA)

## User Story
As a registered user, I want to log in with multi-factor authentication so that my account is protected from unauthorized access.

## Description
Implement MFA for the user login flow. After entering valid credentials (email + password), the user must complete a second authentication step using one of the following methods:
- **TOTP** — Time-based one-time password via an authenticator app (Google Authenticator, Authy)
- **SMS** — One-time code sent to the registered phone number
- **Email** — One-time code sent to the registered email address

MFA should be optional but can be enforced by an organization admin.

## Acceptance Criteria
1. Users can enable/disable MFA from their account settings.
2. When MFA is enabled, after entering valid credentials the user is prompted for a second factor.
3. TOTP codes are 6 digits and valid for 30 seconds.
4. SMS/Email codes are 6 digits and valid for 5 minutes.
5. After 3 failed MFA attempts, the session is locked for 15 minutes.
6. Organization admins can enforce MFA for all members.
7. Users can set up backup recovery codes (one-time use, 8 codes generated).
8. The login flow must complete within 2 seconds (excluding user input time).

## Technical Notes
- Backend: REST API on Node.js / Express
- Auth service: JWT with refresh tokens
- Database: PostgreSQL
- SMS provider: Twilio
- Existing auth middleware at `/src/middleware/auth.js`

## Mockups
- Login page with MFA step (see Figma link in attachments)
- Account settings MFA toggle section
