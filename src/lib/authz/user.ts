/**
 * Build the AuthUser from the per-request DB load (docs/03-rbac.md §7). Pure; 100% coverage.
 */
import { getPermission, isPermissionKey, type PermissionKey } from "./catalog";
import type { AuthUser, Scope, UserStatus, UserType } from "./types";

export type LoadedUser = {
  id: string;
  email: string;
  name: string;
  type: UserType;
  status: UserStatus;
  clientId: string | null;
  twoFactorEnabled: boolean | null;
  group: {
    id: string;
    name: string;
    rank: number;
    isSystem: boolean;
    grants: { permissionKey: string; scope: Scope }[];
  } | null;
  employee: { id: string; teamId: string | null; leads: { teamId: string }[] } | null;
};

/** Prisma `include` that produces a LoadedUser. */
export const AUTH_USER_INCLUDE = {
  group: {
    select: {
      id: true,
      name: true,
      rank: true,
      isSystem: true,
      grants: { select: { permissionKey: true, scope: true } },
    },
  },
  employee: { select: { id: true, teamId: true, leads: { select: { teamId: true } } } },
} as const;

export function toAuthUser(u: LoadedUser): AuthUser {
  // Super Admin = the system group at rank 0 (R1). Never derived from a name.
  const isSuperAdmin = u.type === "STAFF" && u.group?.isSystem === true && u.group.rank === 0;

  const grants = new Map<PermissionKey, Scope>();
  for (const g of u.group?.grants ?? []) {
    if (!isPermissionKey(g.permissionKey)) continue; // stale key not yet removed by catalog sync
    const def = getPermission(g.permissionKey);
    if (u.type === "CLIENT" && !def?.clientAllowed) continue; // R12
    grants.set(g.permissionKey, def?.scopable ? g.scope : "ALL");
  }

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    type: u.type,
    status: u.status,
    rank: u.group?.rank ?? null,
    groupId: u.group?.id ?? null,
    groupName: u.group?.name ?? null,
    isSuperAdmin,
    grants,
    // Client users have no employee link and never appear in team scopes (03 §5a).
    employeeId: u.type === "STAFF" ? (u.employee?.id ?? null) : null,
    teamId: u.type === "STAFF" ? (u.employee?.teamId ?? null) : null,
    ledTeamIds: u.type === "STAFF" ? (u.employee?.leads.map((l) => l.teamId) ?? []) : [],
    clientId: u.clientId,
    twoFactorEnabled: u.twoFactorEnabled === true,
  };
}
