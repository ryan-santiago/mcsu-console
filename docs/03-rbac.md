# 03 · Access control: Groups, Rank, Permissions, Scope

This is the most important spec in the project. Every module depends on it. If code disagrees with this doc, the code is wrong.

## 1. Concepts

| Concept | Meaning |
|---|---|
| **User** | A login account (Better Auth). Status `PENDING → ACTIVE ⇄ SUSPENDED`. Optionally linked to one **Employee** (matched by work email). |
| **Group** | A named bundle of permission grants with a **rank**. Each user belongs to **exactly one** group (none while pending). |
| **Rank** | Integer ≥ 0. **Lower number = more authority.** Super Admin = `0`. |
| **Permission** | A capability key from the **catalog** in code, e.g. `employee.view`. |
| **Scope** | How far a grant reaches: `ALL` › `TEAM` › `OWN`. Applies only to *scopable* permissions. |
| **Team lead** | A per-team assignment made in **Maintenance → Teams**. It is **data, not a group**. It decides *which* teams `TEAM` scope covers. |

> The group gives **what you can do and how widely**. Team-lead assignments give **which teams "TEAM" means for you**. The two are separate on purpose. Someone in a `TEAM`-scoped group who leads no team sees only their own records.

## 2. Seed groups

| Group | Rank | System | Intent |
|---|---|---|---|
| Super Admin | 0 | ✅ | Every permission, implicitly. Read-only in the UI. Can't be deleted. |
| Administrator | 10 | | Every catalog permission at `ALL` (but still bound by the rank rules, so it can't touch Super Admin) |
| Manager | 20 | | All workforce/engagement data at `ALL`, approves registrations, assigns team leads. No group, audit or settings management |
| Team Lead | 30 | | Workforce/engagement at `TEAM`, including **`employee.view_compensation@TEAM`** (needed for salary-increase recommendations, Q9) and **`employee.review_changes@TEAM`**. Monitor their teams' activity reports and reopen MARs |
| Employee | 40 | | **Default on approval.** Own profile, own activity reports, assigned work items (`OWN`) |
| Viewer | 50 | | Read-only, `OWN` |

Ranks are spaced by 10 so groups can be inserted between them later. The `Client Portal` group (rank 90, audience `CLIENT`) is added by the seed in Phase 3 (§5a).

### 2a. Seed grant matrix
`A` = ALL, `T` = TEAM, `O` = OWN, `✓` = granted (global permission), blank = not granted. Super Admin holds everything implicitly and has no rows. The seed builds these grants from this table, importing keys from `catalog.ts`.

| Permission | Admin 10 | Manager 20 | Team Lead 30 | Employee 40 | Viewer 50 |
|---|---|---|---|---|---|
| `dashboard.view` | A | A | T | O | O |
| `employee.view` | A | A | T | O | O |
| `employee.view_compensation` | A | A | T (Q9) | O | |
| `employee.create` | ✓ | ✓ | | | |
| `employee.update` | A | A | | | |
| `employee.review_changes` | A | A | T | | |
| `employee.deactivate` | A | A | | | |
| `employee.restore` | ✓ | ✓ | | | |
| `employee.export` | A | A | T | | |
| `project.view` | A | A | T | O | O |
| `project.view_financials` | A | A | | | |
| `project.create` | ✓ | ✓ | | | |
| `project.update` | A | A | | | |
| `project.delete` | A | A | | | |
| `onelot.view` | A | A | T | O | O |
| `onelot.create` | ✓ | ✓ | ✓ | | |
| `onelot.manage` | A | A | T | | |
| `onelot.work` | A | A | T | O | |
| `onelot.delete` | A | A | | | |
| `activity_report.view` | A | A | T | O | O |
| `activity_report.submit` | ✓ | ✓ | ✓ | ✓ | |
| `activity_report.reopen` | A | A | T | | |
| `activity_report.export` | A | A | T | O | |
| `staff_aug.view` | A | A | T | | |
| `maintenance.view` | ✓ | ✓ | ✓ | | |
| `maintenance.manage` | ✓ | | | | |
| `team.manage_leads` | ✓ | ✓ | | | |
| `user.view` | ✓ | ✓ | | | |
| `user.approve` | ✓ | ✓ | | | |
| `user.update` | ✓ | | | | |
| `user.delete` | ✓ | | | | |
| `group.view` | ✓ | ✓ | | | |
| `group.create` / `group.update` / `group.delete` | ✓ | | | | |
| `audit.view` | ✓ | | | | |
| `settings.manage` | ✓ | | | | |

`employee.view_compensation@OWN` for Employee means people can see their own salary on their own profile. Ranks **may repeat**, for peer groups with different duties. Comparisons are strict, so peers can't manage each other.

## 3. Permission catalog

There is **one source of truth**: `src/lib/authz/catalog.ts`.

```ts
export const CATALOG = [
  { key: "dashboard.view", module: "Dashboard", label: "View dashboard widgets", scopable: true },
  // …
] as const satisfies readonly PermissionDef[];
export type PermissionKey = (typeof CATALOG)[number]["key"];
```

**Key format:** `<resource>.<action>` (lower snake for multi-word resources). `S` = scopable (ALL/TEAM/OWN), `—` = global (stored as `ALL`).

| Module | Key | S | Label |
|---|---|---|---|
| Dashboard | `dashboard.view` | S | View dashboard widgets |
| Employees | `employee.view` | S | List and view employees |
| | `employee.view_compensation` | S | View salary and allowances |
| | `employee.create` | — | Add employees |
| | `employee.update` | S | Edit employee profile, employment & deployment history |
| | `employee.review_changes` | S | Review (approve / reject) self-service profile change requests. Doesn't allow direct edits |
| | `employee.deactivate` | S | Resign / soft-delete an employee |
| | `employee.restore` | — | Restore a deactivated employee |
| | `employee.export` | S | Export the employee list |
| Projects (S3P) | `project.view` | S | List and view projects |
| | `project.view_financials` | S | View contract price, cost, gross profit |
| | `project.create` | — | Create projects |
| | `project.update` | S | Edit projects, contract lines, team assignment |
| | `project.delete` | S | Archive projects |
| One-Lot | `onelot.view` | S | View One-Lot workspaces |
| | `onelot.create` | — | Create a One-Lot workspace |
| | `onelot.manage` | S | Settings, members, linked S3Ps, sprints, board columns |
| | `onelot.work` | S | Create/edit work items, comment, upload documents |
| | `onelot.delete` | S | Archive a One-Lot workspace (soft, `archivedAt`) |
| Activity Reports | `activity_report.view` | S | View activity reports (OWN = mine) |
| | `activity_report.submit` | — | Log own daily activity |
| | `activity_report.reopen` | S | Reopen a sent/acknowledged MAR (reason required); record a client acknowledgment on an employee's behalf. There's no internal MAR approval (Q4) |
| | `activity_report.export` | S | Generate MAR PDF / monitoring export |
| Staff Augmentation | `staff_aug.view` | S | View deployments and the renewal board (deployment edits need `employee.update`) |
| Maintenance | `maintenance.view` | — | View lookup tables |
| | `maintenance.manage` | — | Create / edit / deactivate lookups |
| | `team.manage_leads` | — | Assign team leads |
| Users | `user.view` | — | List users |
| | `user.approve` | — | Approve / reject registrations |
| | `user.update` | — | Change group, suspend / reactivate, link employee |
| | `user.delete` | — | Delete users |
| Groups & Roles | `group.view` | — | View groups and their permissions |
| | `group.create` | — | Create groups |
| | `group.update` | — | Edit group details and permissions |
| | `group.delete` | — | Delete groups |
| Audit | `audit.view` | — | View audit trail |
| Settings | `settings.manage` | — | Organization-wide settings |
| *Managed Services (Phase 3)* | `ticket.view` S, `ticket.create` —, `ticket.update` S, `ticket.assign` S, `ticket.close` S | | |

Every signed-in active user can always use their own profile, theme preferences and password change. These need no permission.

### Catalog sync
`prisma/seed.ts` → `syncCatalog()` runs on every deploy:
1. Upserts each catalog entry into the `Permission` table (key, module, label, description, scopable, sortOrder).
2. **Deletes `Permission` rows that are no longer in the catalog.** `GroupPermission` rows cascade, so stale keys can never break a save.
3. Forces `scope = ALL` on grants of non-scopable permissions.
4. Super Admin gets **no rows**. Its permissions are implicit.

## 4. Scope semantics

`scopeWhere(user, key)` returns a Prisma `where` fragment for the resource that `key` guards.

| Resource | `ALL` | `TEAM` | `OWN` |
|---|---|---|---|
| Employee | `{}` | `teamId ∈ ledTeamIds` **OR** self | `id = user.employeeId` |
| Project (S3P) | `{}` | `teams some teamId ∈ ledTeamIds` **OR** OWN-match | the user's employee has **any** deployment on it (current or past), or the user is a member of a linked One-Lot |
| One-Lot | `{}` | any linked S3P has a team ∈ `ledTeamIds` **OR** user is a member | user is a member (see §5b for what membership allows) |
| Work item | via its One-Lot | via its One-Lot | assignee or reporter = user, or member of the One-Lot |
| Activity report | `{}` | `employee.teamId ∈ ledTeamIds` **OR** own | `employeeId = user.employeeId` |
| Staff aug (deployment) | `{}` | `employee.teamId ∈ ledTeamIds` **OR** own | `employeeId = user.employeeId` |
| Employee change request | `{}` | `employee.teamId ∈ ledTeamIds` (never own: you can't review your own request) | — (not granted at OWN) |

- `ledTeamIds` = teams where the user's linked employee is a `TeamLead`. A user without a linked employee has `ledTeamIds = []` and no OWN match. They see nothing scoped unless they have `ALL`.
- If the user lacks the permission entirely, `scopeWhere` returns an impossible filter (`{ id: { in: [] } }`), and the caller should already have failed `can()`.
- Every list query, detail query and action target lookup **must** include `scopeWhere`. A detail page out of scope returns `notFound()`.
- Write actions use the scope of the *write* permission (e.g. `employee.update`), not the read one.

## 5. Policy rules

They're implemented in `src/lib/authz/policy.ts`, the server is the only enforcer, and they have 100% branch test coverage.

| # | Rule |
|---|---|
| R1 | **Super Admin** (`rank 0`, `isSystem`) holds every permission at `ALL`. Its group can't be edited, renamed, re-ranked or deleted. |
| R2 | **Manage a user** (approve, change group, suspend, delete, link employee) only if `actor.rank < target.group.rank`. Pending users (no group) can be managed by anyone with `user.approve`/`user.update`. |
| R3 | **Never act on yourself** through User Management (group, status, delete). Use Settings for your own profile. |
| R4 | **Assign a group** (on approval or change) only if `group.rank > actor.rank`. |
| R5 | **Create or edit a group** only if `actor.rank < group.rank`, and the new or edited rank must be `> actor.rank`. **You can't edit your own group.** |
| R6 | **Grant a permission** only if the actor holds it, at a scope no wider than the actor's own (`ALL ⊇ TEAM ⊇ OWN`). An existing grant the actor **can't fully control** is **preserved** exactly and shown read-only: either the actor doesn't hold the permission, or the grant's scope is wider than the actor's (e.g. the group has `employee.view@ALL` and the actor holds it only at `TEAM`). The actor can't remove, narrow or widen such a grant. |
| R7 | **Delete a group** only when it has 0 users (UI offers "Move users to…"), and R5 applies. |
| R8 | **Last Super Admin guard:** you can never suspend, delete or move the last active Super Admin. |
| R9 | **Super Admin peers:** as a special case of R2, a Super Admin may manage *another* Super Admin (still never themselves, and R8 applies). |
| R10 | **Effects are immediate.** Suspending a user or changing their group revokes all their sessions. Authz is loaded from the DB on every request. |
| R11 | **Approval queue visibility:** any holder of `user.approve` sees all pending users. Approving assigns a group that satisfies R4 (the default is `Employee`). |
| R14 | **Audience match:** every group has `audience = STAFF \| CLIENT`. A user can only be placed in a group whose audience equals `User.type`. Staff can never land in `Client Portal`, and client users can never land in a staff group. |
| R15 | **2FA for high authority:** a user whose group rank is ≤ 10 must have TOTP enabled. Until they do, every request except 2FA setup and sign-out is redirected to `/settings/security/2fa-setup` (Q7). |

### Allow/deny test matrix (excerpt, encoded as Vitest table tests)

| Actor rank | Target rank | Action | Result |
|---|---|---|---|
| 10 | 10 | change group | ❌ R2 (equal) |
| 10 | 20 | change group → rank 10 | ❌ R4 |
| 10 | 20 | change group → rank 30 | ✅ |
| 20 | 10 | suspend | ❌ R2 |
| 10 | own group | edit permissions | ❌ R5 |
| 10 | 30 | grant `group.delete` (actor lacks it) | ❌ R6 |
| 30 (TEAM) | 40 | grant `employee.view@ALL` | ❌ R6 scope |
| 30 (TEAM) | 40 | grant `employee.view@OWN` | ✅ |
| 0 | 0 (other) | suspend | ✅ R9 (if not last) |
| 0 | 0 (last) | suspend | ❌ R8 |
| 20 (holds `employee.view@TEAM`) | 30 (has `employee.view@ALL`) | remove `employee.view` | ❌ preserved, R6 |
| 10 | pending STAFF user | approve into `Client Portal` | ❌ R14 |

## 5a. Client users (Phase 3)
- `User.type = CLIENT` users are **invited** (never self-registered), carry a `clientId`, and belong to the `Client Portal` group (rank 90).
- Catalog entries carry a `clientAllowed` flag. Only `ticket.view`, `ticket.create` and `ticket.update` (comment and reopen own) are `clientAllowed`. Policy rule **R12:** a client user can never hold a non-`clientAllowed` permission, whatever their group says.
- **R13:** every scoped query for a client user is also constrained to `clientId = user.clientId`. `OWN` = tickets they raised. `ALL` = all tickets of **their** client (e.g. the client's IT manager).
- Client users have no Employee link, never appear in team scopes, and can't be team leads.

## 5b. Resource roles (One-Lot membership)
Group grants are the main authorization path. **Exactly one** resource-level role exists: One-Lot membership (`OneLotMember.role`). It's spec'd here so that it stays the only exception ([ADR 0013](adr/0013-one-lot-resource-roles.md)).

| Membership role | Equivalent rights **inside that one workspace** |
|---|---|
| `OWNER` | `onelot.view` + `onelot.work` + `onelot.manage` |
| `MEMBER` | `onelot.view` + `onelot.work` |
| `VIEWER` | `onelot.view` |

- **Effective right** = group grant (if the workspace is in that grant's scope) **OR** membership role. Membership never grants `onelot.create` or `onelot.delete`, and never grants anything outside the workspace (e.g. it doesn't unlock `project.view_financials` on linked S3Ps).
- **Enforcement:** One-Lot actions declare `authedAction({ permission: "onelot.manage", resource: { type: "onelot", id: (input) => input.oneLotId } }, …)`. The wrapper passes if `can(user, permission)` **or** `membershipAllows(user, oneLotId, permission)`. This replaces the plain `can()` pre-check for One-Lot actions only. The handler still re-checks the target with `oneLotWhere(user, permission)`, which ORs scope and membership.
- **Who manages membership:** `onelot.manage` in scope, or an `OWNER`. An `OWNER` can't remove or demote the last `OWNER`.
- Suspended users keep their membership rows but have no session (R10), so they have no access.
- `src/lib/authz/resource.ts` holds `membershipAllows` and `oneLotWhere`, and needs 100% branch coverage like the rest of `lib/authz`.

## 6. Group editor UX
Based on the reference "Groups & Roles" screens.

- **List:** cards with name, `rank N` (mono), description, user count, `granted / total` permissions, and an **Edit** button (or **View** for system/out-of-rank groups). A delete icon is shown only when R7 allows it. A `System` badge marks Super Admin.
- **Editor:** a left "Details" card (name, rank with the hint "Lower = more authority. Yours is N, so use N+1 or higher", description) and a right "Permissions" card grouped by module. Each permission shows a checkbox, label, mono key, and **a scope selector (ALL / TEAM / OWN) for scopable permissions**.
  - Permissions the actor can't grant are **visible but disabled**, with the tooltip "You don't hold this permission". Scopes wider than the actor's are disabled the same way.
  - The header shows "**N selected.** You can only grant permissions you have yourself."
  - Module-level "select all" respects disabled items.
- **Read-only** mode (Super Admin, or a group with rank ≤ actor's) shows a lock banner: "This is a system group…" or "This group is at or above your rank."

## 7. Implementation sketch

```ts
// src/lib/authz/session.ts
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  const u = await prisma.user.findUnique({
    where: { id: s.user.id },
    include: { group: { include: { grants: true } }, employee: { select: { id: true, teamId: true, leads: { select: { teamId: true } } } } },
  });
  if (!u || u.status !== "ACTIVE") return null; // requireUser() sends a PENDING session to /pending, anything else to /login
  return toAuthUser(u); // { id, rank, isSuperAdmin, grants: Map<PermissionKey, Scope>, employeeId, teamId, ledTeamIds }
});

// src/lib/authz/policy.ts
export const can = (u: AuthUser, key: PermissionKey) => u.isSuperAdmin || u.grants.has(key);
export const scopeOf = (u: AuthUser, key: PermissionKey): Scope | null => u.isSuperAdmin ? "ALL" : u.grants.get(key) ?? null;
export function assertCanManageUser(actor: AuthUser, target: { id: string; rank: number | null; isSuperAdmin: boolean }) { /* R2, R3, R9 */ }
export function assertCanAssignGroup(actor: AuthUser, group: { rank: number; audience: UserType }, target: { type: UserType }) { /* R4, R14 */ }
export function assertCanEditGroup(actor: AuthUser, group: { id: string; rank: number; isSystem: boolean }, nextRank?: number) { /* R1, R5 */ }
export function mergeGrants(actor: AuthUser, current: Grant[], requested: Grant[]): Grant[] { /* R6 */ }

// src/lib/authz/resource.ts (§5b)
export function membershipAllows(u: AuthUser, role: OneLotRole | null, key: PermissionKey): boolean { /* OWNER/MEMBER/VIEWER table */ }
export function oneLotWhere(u: AuthUser, key: PermissionKey): Prisma.OneLotProjectWhereInput { /* scopeWhere OR membership */ }
```

## Lessons from mcsu-app
Problems found in the old app, and how this design prevents each one:

| mcsu-app problem | Prevention here |
|---|---|
| Higher rank = more authority; equal rank allowed (`>` / `<=`) | Lower = more, **strict** comparisons (R2/R4/R5), tested |
| No rank check on create/update/delete role; could re-rank Admin or edit own role | R1, R5, R7 |
| Could grant permissions the actor doesn't hold | R6 + disabled UI |
| Matrix listed all permissions regardless of actor | §6 disabled-state UI driven by `mergeGrants` |
| Stale keys in `role.permissions` JSON broke saves | Normalized `GroupPermission` FK to `Permission` + catalog sync deletes stale keys |
| Permission lists copied in rbac.ts / seed / JSON / SQL | Single catalog; seeds import it |
| Cookie cache kept suspended users active for up to 5 min | No authz in the cookie cache; per-request load; session revocation (R10) |
| `roleId === "admin"` hardcoded bypasses | Only `isSuperAdmin` (derived from the system group) inside `can()`; lint rule bans comparing group names |
| `employees:read_all` one-off for team scoping | Generic scopes for every module |
| Team approvers validated only in the UI picker | `team.manage_leads` action validates on the server |
| Pending users silently held `viewer` | Pending users have `groupId = null` and no grants |
