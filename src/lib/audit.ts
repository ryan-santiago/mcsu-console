import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

/**
 * Audit trail (docs/modules/audit-trail.md). Append-only: there is no update or delete API.
 * - Compensation fields are stored as-is and masked when READ (see maskChanges).
 * - Secrets (passwords, tokens, 2FA secrets) must never be passed in.
 */

/** Sensitivity class of a field. "compensation" is masked unless the viewer has view_compensation. */
export type Sensitivity = "compensation";

export type AuditChange = {
  field: string;
  label: string;
  oldValue: string | null;
  newValue: string | null;
  sensitive?: Sensitivity;
};

export type AuditEntry = {
  module: string;
  action: string;
  entityId?: string | null;
  entityLabel?: string | null;
  changes?: AuditChange[];
};

export type AuditActor = {
  id: string | null;
  email: string | null;
  ip: string | null;
  userAgent: string | null;
};

export type FieldLabels = Record<string, string | { label: string; sensitive?: Sensitivity }>;

type Db = PrismaClient | Prisma.TransactionClient;

/** Normalize a value for storage/comparison: Date → ISO, Decimal/objects → string, empty → null. */
export function normalizeAuditValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (Array.isArray(value)) return JSON.stringify(value);
  if (
    typeof value === "object" &&
    "toString" in value &&
    value.toString !== Object.prototype.toString
  ) {
    return value.toString(); // Prisma.Decimal and similar
  }
  return JSON.stringify(value);
}

/** Changed, labelled fields only. Unlabelled fields are ignored (so secrets never leak in by accident). */
export function diffFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  labels: FieldLabels,
): AuditChange[] {
  const changes: AuditChange[] = [];
  for (const [field, config] of Object.entries(labels)) {
    const oldValue = normalizeAuditValue(before?.[field]);
    const newValue = normalizeAuditValue(after?.[field]);
    if (oldValue === newValue) continue;
    const { label, sensitive } =
      typeof config === "string" ? { label: config, sensitive: undefined } : config;
    changes.push({ field, label, oldValue, newValue, ...(sensitive ? { sensitive } : {}) });
  }
  return changes;
}

export const MASK = "•••";

/** Read-time masking: hide compensation values unless the viewer may see them. */
export function maskChanges(changes: AuditChange[], canSeeCompensation: boolean): AuditChange[] {
  if (canSeeCompensation) return changes;
  return changes.map((c) =>
    c.sensitive === "compensation"
      ? {
          ...c,
          oldValue: c.oldValue === null ? null : MASK,
          newValue: c.newValue === null ? null : MASK,
        }
      : c,
  );
}

export async function recordAudit(db: Db, actor: AuditActor, entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      module: entry.module,
      action: entry.action,
      entityId: entry.entityId ?? null,
      entityLabel: entry.entityLabel ?? null,
      changes: entry.changes && entry.changes.length > 0 ? entry.changes : undefined,
      actorId: actor.id,
      actorEmail: actor.email,
      ipAddress: actor.ip,
      userAgent: actor.userAgent?.slice(0, 500) ?? null,
    },
  });
}

/** Client IP and user agent from request headers (the ALB sets x-forwarded-for). */
export function requestMeta(headers: Headers): { ip: string | null; userAgent: string | null } {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || null;
  return { ip, userAgent: headers.get("user-agent") };
}
