# 0002 · Groups with inverted rank and scoped permissions

**Status:** Accepted · 2026-10-21

## Context
mcsu-app's role system (higher rank = more power, `>=` comparisons, JSON permission arrays, an `employees:read_all` one-off, `roleId === "admin"` checks) allowed privilege escalation and couldn't express "Team Lead sees only their team" in a reusable way. The user's other app (Gintong Araw) has a Groups & Roles UX that works well.

## Decision
- **Group** with integer **rank, where lower = more authority** (Super Admin = 0). All comparisons are strict.
- Permissions come from a **code catalog**, synced to a `Permission` table. Grants are in `GroupPermission(groupId, key, scope)`.
- **Scope** `ALL | TEAM | OWN` on scopable permissions. `TEAM` resolves through `TeamLead` assignments (Maintenance), not group names.
- You can only grant what you hold, at a scope no wider than yours. You can't edit your own group, and you can't act on equal or higher ranks.
- Spec: [03-rbac.md](../03-rbac.md).

## Consequences
- ➕ One mechanism for every current and future module (Managed Services tickets get `TEAM` for free).
- ➕ The escalation paths found in mcsu-app are closed and covered by tests.
- ➖ Every query must remember `scopeWhere`. Mitigated by the `authedQuery` helper, code review checklist and e2e persona tests.
