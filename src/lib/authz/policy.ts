/**
 * Policy rules R1–R15 (docs/03-rbac.md §5). Pure functions: the server is the only enforcer,
 * and this file is held to 100% branch coverage. Never branch on group names anywhere else.
 */
import { CATALOG, getPermission, isScopable, type PermissionKey } from "./catalog";
import { PolicyError } from "./errors";
import { TWO_FACTOR_MAX_RANK, type AuthUser, type Grant, type Scope, type UserType } from "./types";

const SCOPE_WIDTH: Record<Scope, number> = { OWN: 1, TEAM: 2, ALL: 3 };

/** True if `a` reaches at least as far as `b` (ALL ⊇ TEAM ⊇ OWN). */
export function scopeCovers(a: Scope, b: Scope): boolean {
  return SCOPE_WIDTH[a] >= SCOPE_WIDTH[b];
}

/** Does the user hold the permission at any scope? (R1: Super Admin holds everything.) */
export function can(user: AuthUser, key: PermissionKey): boolean {
  return user.isSuperAdmin || user.grants.has(key);
}

/** The scope the user holds `key` at, or null. Global permissions report ALL. */
export function scopeOf(user: AuthUser, key: PermissionKey): Scope | null {
  if (user.isSuperAdmin) return "ALL";
  return user.grants.get(key) ?? null;
}

/**
 * 2FA is only for people: users linked to an Employee record (decided 2026-10-22).
 * Accounts without employee data (e.g. the mcsu_automations service account) never use it.
 */
export function canUseTwoFactor(user: AuthUser): boolean {
  return user.employeeId !== null;
}

/** R15: rank ≤ 10 users WITH employee data must have TOTP enabled before doing anything else. */
export function needsTwoFactorSetup(user: AuthUser): boolean {
  return (
    canUseTwoFactor(user) &&
    user.rank !== null &&
    user.rank <= TWO_FACTOR_MAX_RANK &&
    !user.twoFactorEnabled
  );
}

// ───────────── Users (R2, R3, R8, R9) ─────────────

export type ManagedUser = {
  id: string;
  /** null for PENDING users (no group). */
  rank: number | null;
  isSuperAdmin: boolean;
};

/** R2/R3/R9: may `actor` approve, re-group, suspend, delete or link `target`? */
export function assertCanManageUser(actor: AuthUser, target: ManagedUser): void {
  if (actor.id === target.id) {
    throw new PolicyError("R3", "You can't change your own account here. Use Settings instead.");
  }
  if (target.rank === null) return; // pending: permission checks (user.approve/update) suffice
  if (target.isSuperAdmin) {
    if (!actor.isSuperAdmin) {
      throw new PolicyError("R2", "Only a Super Admin can manage another Super Admin.");
    }
    return; // R9 (R8 is checked separately with assertNotLastSuperAdmin)
  }
  if (actor.rank === null || !(actor.rank < target.rank)) {
    throw new PolicyError("R2", "This user's group is at or above your rank.");
  }
}

/** R8: never suspend, delete or move the last active Super Admin. */
export function assertNotLastSuperAdmin(
  target: { isSuperAdmin: boolean; status: string },
  activeSuperAdminCount: number,
): void {
  if (target.isSuperAdmin && target.status === "ACTIVE" && activeSuperAdminCount <= 1) {
    throw new PolicyError("R8", "This is the last active Super Admin and can't be changed.");
  }
}

// ───────────── Groups (R1, R4, R5, R7, R14) ─────────────

export type GroupRef = {
  id: string;
  rank: number;
  isSystem: boolean;
  audience: UserType;
};

/** R4 + R14: may `actor` place `target` into `group`? */
export function assertCanAssignGroup(
  actor: AuthUser,
  group: GroupRef,
  target: { type: UserType },
): void {
  if (group.audience !== target.type) {
    throw new PolicyError("R14", "This group is for a different kind of account.");
  }
  if (group.isSystem) {
    // Only a Super Admin can make another Super Admin (special case of R9).
    if (!actor.isSuperAdmin)
      throw new PolicyError("R4", "Only a Super Admin can assign this group.");
    return;
  }
  if (actor.rank === null || !(group.rank > actor.rank)) {
    throw new PolicyError("R4", "You can only assign groups ranked below your own.");
  }
}

/** R5: the rank a new or edited group may have. */
export function assertValidGroupRank(actor: AuthUser, rank: number): void {
  if (!Number.isInteger(rank) || rank < 0) {
    throw new PolicyError("R5", "Rank must be a whole number of 0 or more.");
  }
  if (actor.rank === null || !(rank > actor.rank)) {
    throw new PolicyError("R5", `Rank must be higher than yours (${actor.rank ?? "–"}).`);
  }
}

/** R1/R5: may `actor` edit `group` (details, permissions, rank)? */
export function assertCanEditGroup(actor: AuthUser, group: GroupRef, nextRank?: number): void {
  if (group.isSystem) {
    throw new PolicyError("R1", "This is a system group. It can't be changed.");
  }
  if (actor.groupId === group.id) {
    throw new PolicyError("R5", "You can't edit your own group.");
  }
  if (actor.rank === null || !(actor.rank < group.rank)) {
    throw new PolicyError("R5", "This group is at or above your rank.");
  }
  if (nextRank !== undefined) assertValidGroupRank(actor, nextRank);
}

/** R7 (+R1/R5): may `actor` delete `group`? */
export function assertCanDeleteGroup(actor: AuthUser, group: GroupRef, userCount: number): void {
  assertCanEditGroup(actor, group);
  if (userCount > 0) {
    throw new PolicyError("R7", "Move this group's users to another group before deleting it.");
  }
}

// ───────────── Grants (R6) ─────────────

/** The widest scope `actor` may grant for `key`, or null if they can't grant it at all. */
export function grantableScope(actor: AuthUser, key: PermissionKey): Scope | null {
  return scopeOf(actor, key);
}

/** Can `actor` fully control this existing grant (see it change, remove it)? */
function controls(actor: AuthUser, grant: Grant): boolean {
  const held = scopeOf(actor, grant.key);
  if (held === null) return false;
  return isScopable(grant.key) ? scopeCovers(held, grant.scope) : true;
}

/**
 * R6: merge an editor's requested grants into a group's current grants.
 * - A grant the actor can't fully control is preserved exactly (they can't remove/narrow/widen it).
 * - Every other requested grant must be held by the actor at a scope at least as wide.
 * - Non-scopable permissions are always stored as ALL.
 * Throws PolicyError for anything the actor may not grant. Returns grants in catalog order.
 */
export function mergeGrants(
  actor: AuthUser,
  current: readonly Grant[],
  requested: readonly Grant[],
): Grant[] {
  const currentByKey = new Map(current.map((g) => [g.key, g]));
  const requestedByKey = new Map<PermissionKey, Grant>();
  for (const grant of requested) {
    if (!getPermission(grant.key)) throw new PolicyError("R6", `Unknown permission: ${grant.key}`);
    requestedByKey.set(grant.key, grant);
  }

  const result: Grant[] = [];
  for (const { key, scopable } of CATALOG) {
    const existing = currentByKey.get(key);
    if (existing && !controls(actor, existing)) {
      result.push(existing); // preserved: outside the actor's reach
      continue;
    }
    const wanted = requestedByKey.get(key);
    if (!wanted) continue; // removed (or never granted)
    const held = scopeOf(actor, key);
    if (held === null) {
      throw new PolicyError("R6", `You can't grant ${key} because you don't hold it.`);
    }
    if (!scopable) {
      result.push({ key, scope: "ALL" });
      continue;
    }
    if (!scopeCovers(held, wanted.scope)) {
      throw new PolicyError("R6", `You can grant ${key} at ${held} scope at most.`);
    }
    result.push({ key, scope: wanted.scope });
  }
  return result;
}
