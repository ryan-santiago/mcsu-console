# 0004 · Self-registration with permission-based approval

**Status:** Accepted · 2026-10-21

## Context
Every employee must be able to log in (own MARs, assigned work). Admins don't want to create every account by hand.

## Decision
- Users self-register (email + password, optionally limited to company domains). They become `PENDING` with no group and no access.
- Anyone holding `user.approve` approves or rejects them, choosing a group with a rank **greater than their own** (the default group is `Employee`).
- On registration and approval, the user is **auto-linked** to the Employee whose `workEmail` matches. User Management displays the employee's name, position, team and photo when linked, and the registered email otherwise.

## Consequences
- ➕ Low admin effort, with a clear approval audit trail.
- ➖ Requires domain restriction and rate limiting to avoid spam sign-ups (see Q8).
