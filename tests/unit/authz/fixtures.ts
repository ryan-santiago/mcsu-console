import type { PermissionKey } from "@/lib/authz/catalog";
import type { AuthUser, Scope } from "@/lib/authz/types";

/** Build an AuthUser for policy tests. Defaults: active staff, rank 40, no grants. */
export function makeUser(
  overrides: Omit<Partial<AuthUser>, "grants"> & {
    grants?: Partial<Record<PermissionKey, Scope>>;
  } = {},
): AuthUser {
  const { grants, ...rest } = overrides;
  return {
    id: "u-actor",
    email: "actor@questronix.com.ph",
    name: "Actor",
    type: "STAFF",
    status: "ACTIVE",
    rank: 40,
    groupId: "g-actor",
    groupName: "Employee",
    isSuperAdmin: false,
    employeeId: "e-actor",
    teamId: "t-own",
    ledTeamIds: [],
    clientId: null,
    twoFactorEnabled: false,
    ...rest,
    grants: new Map(Object.entries(grants ?? {}) as [PermissionKey, Scope][]),
  };
}

export const superAdmin = () =>
  makeUser({
    id: "u-sa",
    rank: 0,
    groupId: "g-sa",
    groupName: "Super Admin",
    isSuperAdmin: true,
    twoFactorEnabled: true,
  });
