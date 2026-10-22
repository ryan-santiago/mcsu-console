import "server-only";
import { subDays } from "date-fns";
import type { Prisma } from "@/generated/prisma/client";
import { maskChanges, type AuditChange } from "@/lib/audit";
import { scopeOf } from "@/lib/authz/policy";
import { authedQuery } from "@/lib/authz/query";
import type { AuthUser } from "@/lib/authz/types";
import { TZDate } from "@date-fns/tz";
import { prisma } from "@/lib/db";
import { APP_TIME_ZONE } from "@/lib/dates";
import type { AuditFilters } from "@/lib/validation/audit";

export type AuditRowDTO = {
  id: string;
  createdAt: string;
  module: string;
  action: string;
  entityId: string | null;
  entityLabel: string | null;
  changes: AuditChange[];
  actorName: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
};

/** Manila-day bounds for date-only filters. Default: the last 30 days. */
function dateRange(filters: AuditFilters): { gte: Date; lt?: Date } {
  const start = filters.from
    ? new TZDate(`${filters.from}T00:00:00`, APP_TIME_ZONE)
    : subDays(new Date(), 30);
  const end = filters.to ? new TZDate(`${filters.to}T00:00:00`, APP_TIME_ZONE) : null;
  return end ? { gte: start, lt: new Date(end.getTime() + 86_400_000) } : { gte: start };
}

function whereFor(filters: AuditFilters): Prisma.AuditLogWhereInput {
  const q = filters.q;
  return {
    createdAt: dateRange(filters),
    ...(filters.module ? { module: filters.module } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.actor
      ? {
          OR: [
            { actorEmail: { contains: filters.actor, mode: "insensitive" } },
            { actor: { name: { contains: filters.actor, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(q
      ? {
          AND: [
            {
              OR: [
                { entityLabel: { contains: q, mode: "insensitive" } },
                { entityId: q },
                { ipAddress: { startsWith: q } },
              ],
            },
          ],
        }
      : {}),
  };
}

/** Compensation values are masked at read time (docs/modules/audit-trail.md). */
function toDTO(
  row: Prisma.AuditLogGetPayload<{ include: { actor: { select: { name: true } } } }>,
  canSeeCompensation: boolean,
): AuditRowDTO {
  const changes = Array.isArray(row.changes) ? (row.changes as unknown as AuditChange[]) : [];
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    module: row.module,
    action: row.action,
    entityId: row.entityId,
    entityLabel: row.entityLabel,
    changes: maskChanges(changes, canSeeCompensation),
    actorName: row.actor?.name ?? null,
    actorEmail: row.actorEmail,
    ipAddress: row.ipAddress,
  };
}

/** On the global audit page, only ALL-scope compensation viewers see salary values. */
function seesCompensation(user: AuthUser) {
  return scopeOf(user, "employee.view_compensation") === "ALL";
}

export const listAuditLog = authedQuery("audit.view", async (user, filters: AuditFilters) => {
  const where = whereFor(filters);
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.size,
      take: filters.size,
    }),
  ]);
  return { total, rows: rows.map((r) => toDTO(r, seesCompensation(user))) };
});

export const AUDIT_EXPORT_LIMIT = 5000;

/** CSV export: same filters, capped at 5,000 rows. Caller must have checked audit.view. */
export async function exportAuditLog(user: AuthUser, filters: AuditFilters) {
  const rows = await prisma.auditLog.findMany({
    where: whereFor(filters),
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: AUDIT_EXPORT_LIMIT,
  });
  return rows.map((r) => toDTO(r, seesCompensation(user)));
}

/** Distinct modules/actions for the filter dropdowns. */
export const listAuditFacets = authedQuery("audit.view", async () => {
  const [modules, actions] = await Promise.all([
    prisma.auditLog.findMany({
      distinct: ["module"],
      select: { module: true },
      orderBy: { module: "asc" },
    }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
  ]);
  return { modules: modules.map((m) => m.module), actions: actions.map((a) => a.action) };
});
