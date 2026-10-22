# 0013 · One-Lot membership roles as the single resource-level authorization path

**Status:** Accepted · 2026-10-22

## Context
One-Lot workspaces are run by whoever owns the delivery, and that person isn't always in a group with `onelot.manage` in scope (e.g. an Employee-group developer who owns a small workspace). The module spec gave an `OWNER` member manage-level rights without the group permission. That's a second authorization path next to "permission + scope + rank", and `authedAction({ permission })` would reject it before any membership check ran.

## Decision
- Keep One-Lot membership roles (`OWNER`, `MEMBER`, `VIEWER`). They're the **only** resource-level roles in the system. Any new one needs a new ADR.
- Effective right inside a workspace = group grant in scope **OR** membership role ([03-rbac.md §5b](../03-rbac.md#5b-resource-roles-one-lot-membership)). Membership never grants `onelot.create`, `onelot.delete`, or anything outside the workspace.
- `authedAction` gains an optional `resource` option. When it's set, the pre-check is `can() || membershipAllows()`, and handlers use `oneLotWhere()` (scope OR membership) for the target lookup.
- `src/lib/authz/resource.ts` is held to the same 100% branch coverage as the rest of `lib/authz`.

## Consequences
- ➕ Workspace owners can run their workspace without being given wider group permissions.
- ➕ The exception is explicit, in one file, and tested, so the rule "authorize only through `lib/authz`" still holds.
- ➖ One-Lot queries are slightly more complex (scope OR membership). Mitigated by `oneLotWhere()`.
