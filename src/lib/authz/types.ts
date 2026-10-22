import type { PermissionKey } from "./catalog";

export type Scope = "ALL" | "TEAM" | "OWN";
export type UserType = "STAFF" | "CLIENT";
export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

/** The current user as every policy/scope function sees it. Built per request (ADR 0006). */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  type: UserType;
  status: UserStatus;
  /** null while PENDING (no group). Lower = more authority. */
  rank: number | null;
  groupId: string | null;
  groupName: string | null;
  isSuperAdmin: boolean;
  grants: ReadonlyMap<PermissionKey, Scope>;
  employeeId: string | null;
  teamId: string | null;
  /** Teams this user's employee leads (Maintenance → Teams). Drives TEAM scope. */
  ledTeamIds: readonly string[];
  clientId: string | null;
  twoFactorEnabled: boolean;
};

export type Grant = { key: PermissionKey; scope: Scope };

/** Highest rank number that requires TOTP 2FA (R15). */
export const TWO_FACTOR_MAX_RANK = 10;
