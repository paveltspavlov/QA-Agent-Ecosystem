# Clarifications - ALL ANSWERED

## Q1: Session Lockout Semantics

After 3 failed MFA attempts, is the lockout per-session, per-account, or per-method?

Status: ANSWERED

Answer: Per-account globally. 3 failed attempts on ANY method locks the entire account for 15 minutes.

---

## Q2: Admin Enforcement Retroactivity

When enforcing MFA for members, do existing sessions terminate immediately?

Status: ANSWERED

Answer: Existing sessions continue. Users get 30-day grace period. After grace period, login requires MFA setup.

---

## Q3: Recovery Code Format

Format, scope, reusability, expiration?

Status: ANSWERED

Answer: 8-character alphanumeric. Per-user (8 codes). Single-use only. No expiration - valid until used.

---

## Q4: SMS/Email Failure Handling

If delivery fails, what happens?

Status: ANSWERED

Answer: 3 auto-retries (30s intervals). Can switch methods. If SMS fails try Email, if Email fails use recovery code. Max 3 attempts per method.

---

## Q5: TOTP Clock Skew

Clock tolerance?

Status: ANSWERED

Answer: Accepts +/- 1 time step (60-second window). Shows sync help message if rejected.

---

WORKFLOW CONTROL: UNBLOCKED

Ready to proceed to Step 02.
