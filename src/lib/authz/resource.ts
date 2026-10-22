/**
 * One-Lot membership roles: the ONLY resource-level authorization path
 * (docs/03-rbac.md §5b, ADR 0013). Pure; 100% branch coverage.
 */
import type { Prisma } from "@/generated/prisma/client";
import type { PermissionKey } from "./catalog";
import { can, scopeOf } from "./policy";
import { oneLotScopeWhere } from "./scope";
import type { AuthUser } from "./types";

export type OneLotRole = "OWNER" | "MEMBER" | "VIEWER";

/** Which membership roles grant each One-Lot permission inside their own workspace. */
const ROLES_FOR: Partial<Record<PermissionKey, readonly OneLotRole[]>> = {
  "onelot.view": ["OWNER", "MEMBER", "VIEWER"],
  "onelot.work": ["OWNER", "MEMBER"],
  "onelot.manage": ["OWNER"],
};

/** Roles that grant `key` (never onelot.create/onelot.delete or anything outside One-Lot). */
export function rolesAllowing(key: PermissionKey): readonly OneLotRole[] {
  return ROLES_FOR[key] ?? [];
}

export function membershipAllows(role: OneLotRole | null, key: PermissionKey): boolean {
  return role !== null && rolesAllowing(key).includes(role);
}

/** Effective right in one workspace: group grant in scope OR membership role. */
export function canInOneLot(
  user: AuthUser,
  key: PermissionKey,
  workspace: { inScope: boolean; role: OneLotRole | null },
): boolean {
  return (can(user, key) && workspace.inScope) || membershipAllows(workspace.role, key);
}

/** Workspaces where `user` has `key`: group scope OR a membership role that allows it. */
export function oneLotWhere(user: AuthUser, key: PermissionKey): Prisma.OneLotProjectWhereInput {
  if (scopeOf(user, key) === "ALL") return {};
  const roles = rolesAllowing(key);
  const byRole: Prisma.OneLotProjectWhereInput | null =
    roles.length > 0 ? { members: { some: { userId: user.id, role: { in: [...roles] } } } } : null;
  const byScope = can(user, key) ? oneLotScopeWhere(user, key) : null;
  const conditions = [byScope, byRole].filter(
    (c): c is Prisma.OneLotProjectWhereInput => c !== null,
  );
  return conditions.length > 0 ? { OR: conditions } : { id: { in: [] } };
}
