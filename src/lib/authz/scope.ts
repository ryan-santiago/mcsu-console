/**
 * Scope → Prisma `where` fragments (docs/03-rbac.md §4). Pure; 100% branch coverage.
 *
 * Every list query, detail query and action target lookup MUST include one of these.
 * Write actions use the scope of the WRITE permission (e.g. employee.update), not the read one.
 * A user without the permission gets an impossible filter (callers should already have failed can()).
 */
import type { Prisma } from "@/generated/prisma/client";
import type { PermissionKey } from "./catalog";
import { scopeOf } from "./policy";
import type { AuthUser, Scope } from "./types";

/** Matches nothing. Works for every model with a string `id`. */
export const NOTHING = { id: { in: [] as string[] } } as const;

type Resolved = { scope: Scope; employeeId: string | null; ledTeamIds: readonly string[] } | null;

function resolve(user: AuthUser, key: PermissionKey): Resolved {
  const scope = scopeOf(user, key);
  return scope ? { scope, employeeId: user.employeeId, ledTeamIds: user.ledTeamIds } : null;
}

/** Build OR-conditions; an empty list means "nothing matches". */
function anyOf<T>(conditions: (T | null)[]): { OR: T[] } | typeof NOTHING {
  const present = conditions.filter((c): c is T => c !== null);
  return present.length > 0 ? { OR: present } : NOTHING;
}

/** Rows whose employee is in a team the user leads. */
function ledTeams(ledTeamIds: readonly string[]): { in: string[] } | null {
  return ledTeamIds.length > 0 ? { in: [...ledTeamIds] } : null;
}

// ───────────── Employee ─────────────

export function employeeWhere(user: AuthUser, key: PermissionKey): Prisma.EmployeeWhereInput {
  const r = resolve(user, key);
  if (!r) return NOTHING;
  if (r.scope === "ALL") return {};
  const own = r.employeeId ? { id: r.employeeId } : null;
  if (r.scope === "OWN") return own ?? NOTHING;
  const teams = ledTeams(r.ledTeamIds);
  return anyOf<Prisma.EmployeeWhereInput>([teams ? { teamId: teams } : null, own]);
}

/** Same shape for any model that belongs to one employee (reports, deployments, MARs). */
function employeeOwned(user: AuthUser, key: PermissionKey) {
  const r = resolve(user, key);
  if (!r) return NOTHING;
  if (r.scope === "ALL") return {};
  const own = r.employeeId ? { employeeId: r.employeeId } : null;
  if (r.scope === "OWN") return own ?? NOTHING;
  const teams = ledTeams(r.ledTeamIds);
  return anyOf([teams ? { employee: { teamId: teams } } : null, own]);
}

export function activityReportWhere(
  user: AuthUser,
  key: PermissionKey,
): Prisma.ActivityReportWhereInput {
  return employeeOwned(user, key);
}

export function monthlyReportWhere(
  user: AuthUser,
  key: PermissionKey,
): Prisma.MonthlyActivityReportWhereInput {
  return employeeOwned(user, key);
}

/** Staff Augmentation is a view over deployments (Q21). */
export function deploymentWhere(
  user: AuthUser,
  key: PermissionKey,
): Prisma.EmployeeDeploymentWhereInput {
  return employeeOwned(user, key);
}

/** Change requests: never your own (nobody reviews their own request). No OWN scope. */
export function changeRequestWhere(
  user: AuthUser,
  key: PermissionKey,
): Prisma.EmployeeChangeRequestWhereInput {
  const r = resolve(user, key);
  if (!r || r.scope === "OWN") return NOTHING;
  const notOwn = r.employeeId ? { employeeId: { not: r.employeeId } } : {};
  if (r.scope === "ALL") return notOwn;
  const teams = ledTeams(r.ledTeamIds);
  return teams ? { ...notOwn, employee: { teamId: teams } } : NOTHING;
}

// ───────────── Project (S3P) ─────────────

function projectOwn(user: AuthUser): Prisma.ProjectWhereInput[] {
  const own: Prisma.ProjectWhereInput[] = [
    { oneLotLinks: { some: { oneLotProject: { members: { some: { userId: user.id } } } } } },
  ];
  if (user.employeeId) own.unshift({ deployments: { some: { employeeId: user.employeeId } } });
  return own;
}

export function projectWhere(user: AuthUser, key: PermissionKey): Prisma.ProjectWhereInput {
  const r = resolve(user, key);
  if (!r) return NOTHING;
  if (r.scope === "ALL") return {};
  const own = projectOwn(user);
  if (r.scope === "OWN") return { OR: own };
  const teams = ledTeams(r.ledTeamIds);
  return { OR: [...(teams ? [{ teams: { some: { teamId: teams } } }] : []), ...own] };
}

// ───────────── One-Lot (group scope only; see resource.ts for membership roles) ─────────────

export function oneLotScopeWhere(
  user: AuthUser,
  key: PermissionKey,
): Prisma.OneLotProjectWhereInput {
  const r = resolve(user, key);
  if (!r) return NOTHING;
  if (r.scope === "ALL") return {};
  const member: Prisma.OneLotProjectWhereInput = { members: { some: { userId: user.id } } };
  if (r.scope === "OWN") return member;
  const teams = ledTeams(r.ledTeamIds);
  return anyOf<Prisma.OneLotProjectWhereInput>([
    teams ? { links: { some: { project: { teams: { some: { teamId: teams } } } } } } : null,
    member,
  ]);
}
