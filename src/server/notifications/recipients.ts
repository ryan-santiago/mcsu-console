import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { PermissionKey } from "@/lib/authz/catalog";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Active STAFF users who hold `key` with a scope that covers `target` (docs/modules/notifications.md).
 * Uses the same scope semantics as scopeWhere (03 §4), evaluated "from the other side":
 *  - Super Admin (system group, rank 0) always qualifies
 *  - ALL (and global permissions, stored as ALL) always qualify
 *  - TEAM qualifies when the user's employee leads target.teamId, or is the target employee
 *  - OWN qualifies when the user IS the target employee
 * Without a target, only Super Admin + ALL holders qualify (global events like user.registered).
 */
export async function recipientsFor(
  db: Db,
  key: PermissionKey,
  target?: { employeeId: string | null; teamId: string | null },
): Promise<string[]> {
  const holds = (scope: "ALL" | "TEAM" | "OWN"): Prisma.UserWhereInput => ({
    group: { grants: { some: { permissionKey: key, scope } } },
  });

  const conditions: Prisma.UserWhereInput[] = [
    { group: { isSystem: true, rank: 0 } },
    holds("ALL"),
  ];
  if (target?.teamId) {
    conditions.push({
      AND: [holds("TEAM"), { employee: { leads: { some: { teamId: target.teamId } } } }],
    });
  }
  if (target?.employeeId) {
    conditions.push({
      AND: [{ OR: [holds("TEAM"), holds("OWN")] }, { employeeId: target.employeeId }],
    });
  }

  const users = await db.user.findMany({
    where: { status: "ACTIVE", type: "STAFF", OR: conditions },
    select: { id: true },
  });
  return users.map((u) => u.id);
}
