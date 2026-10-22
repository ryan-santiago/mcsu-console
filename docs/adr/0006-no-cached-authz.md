# 0006 · Authorization data is loaded per request, never cookie-cached

**Status:** Accepted · 2026-10-21

## Context
In mcsu-app, Better Auth's `cookieCache` (5 min) served `status` and `roleId` without checking the DB, so suspended or demoted users kept access for up to 5 minutes.

## Decision
- Better Auth `session.cookieCache` is **disabled**. (If it's ever enabled for performance, it must hold no authz fields.)
- `getCurrentUser()` loads user, status, group, grants and led teams from the DB once per request (React `cache()`).
- Suspending a user or changing their group deletes all their sessions in the same transaction.

## Consequences
- ➕ Access changes take effect on the next request.
- ➖ One extra indexed query per request. That's acceptable at department scale (< 500 users).
