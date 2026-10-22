# Groups & Roles

## Purpose
Define groups (rank + permission grants with scope). The UX is modelled on the Gintong Araw "Groups & Roles" screens.

## Routes
- `/admin/groups`: card grid
- `/admin/groups/new`, `/admin/groups/[id]`: editor (read-only view when not editable)

## Permissions & scope
`group.view`, `group.create`, `group.update`, `group.delete`. Rules R1, R5–R7 in [03-rbac.md](../03-rbac.md#5-policy-rules).

## Screens
**List** (subtitle: "Each group has a rank (lower number = more authority) and a set of permissions."):
- Card: icon (a lock for system groups, a shield for others), name, `rank N` in mono, `System` badge, description, `👤 N users`, `🛡 X / Y permissions`.
- Footer: **Edit** if editable, **View** otherwise. A delete icon appears only if R7 passes; otherwise it's hidden.
- **New group** button (primary, top-right) when the user holds `group.create`.

**Editor:**
- Banner (when read-only): "This is a system group. It always has every permission and can't be changed." or "This group is at or above your rank (N). You can view it but not change it."
- **Details card:** Name, Rank (number input; hint "Lower number = more authority. Yours is N, so use N+1 or higher." Validation: `> actor.rank`), Description.
- **Permissions card:** "**X selected.** You can only grant permissions you have yourself."
  - Module cards in a 2-column grid, catalog order. Each module has a header checkbox (select all grantable).
  - Each row has: checkbox, label, mono key, and for scopable permissions a segmented control **All · Team · Own** (defaults to the widest scope the actor holds).
  - Items the actor doesn't hold are disabled, with a tooltip "You don't hold this permission". Scopes wider than the actor's are disabled.
  - A search box filters permissions. A "Show only granted" toggle is available.
- A sticky footer has **Save** and **Cancel**. Unsaved changes trigger a leave-page guard.

## Data
`Group`, `GroupPermission`, `Permission`. User counts come from `_count.users`.

## Business rules
- Saving uses `mergeGrants(actor, current, requested)`. Grants the actor can't see or change are preserved exactly (R6).
- Rank changes re-validate R5 against both the old and the new rank.
- Deleting a group with users opens a "Move N users to…" picker. The target group must satisfy R4. Moving users revokes their sessions.
- Only one group can be `isDefault` (assigned on approval). Changing it requires `group.update` and R5 on both groups.

## Acceptance criteria
- [ ] An Administrator (10) can't open Super Admin (0) or Administrator (10) in edit mode.
- [ ] Creating a group with rank ≤ the actor's rank fails on the server even if the UI is bypassed.
- [ ] An editor who holds `employee.view` only at `TEAM` can't grant it at `ALL`.
- [ ] Removing a permission from the catalog and deploying removes it from all groups, and saving still works.
- [ ] The X / Y count on cards matches the editor.
