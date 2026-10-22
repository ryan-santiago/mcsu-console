import { connection } from "next/server";
import { can } from "@/lib/authz/policy";
import { getCurrentUser } from "@/lib/authz/session";
import { needsTwoFactorSetup } from "@/lib/authz/policy";
import { formatManila } from "@/lib/dates";
import { parseAuditFilters } from "@/lib/validation/audit";
import { exportAuditLog } from "@/server/audit/queries";

/** CSV export of the filtered audit trail, ≤ 5,000 rows (docs/modules/audit-trail.md). */
export async function GET(request: Request) {
  await connection();
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return new Response("Unauthorized", { status: 401 });
  if (needsTwoFactorSetup(user) || !can(user, "audit.view")) {
    return new Response("Forbidden", { status: 403 });
  }

  const filters = parseAuditFilters(Object.fromEntries(new URL(request.url).searchParams));
  const rows = await exportAuditLog(user, filters);

  const escape = (value: string | null) => {
    const v = value ?? "";
    // Quote everything; neutralize spreadsheet formulas (CSV injection).
    const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const header = [
    "Time (Asia/Manila)",
    "Actor",
    "Actor email",
    "Module",
    "Action",
    "Entity",
    "Entity id",
    "Changes",
    "IP",
  ];
  const lines = rows.map((r) =>
    [
      formatManila(new Date(r.createdAt), "yyyy-MM-dd HH:mm:ss"),
      r.actorName,
      r.actorEmail,
      r.module,
      r.action,
      r.entityLabel,
      r.entityId,
      r.changes.map((c) => `${c.label}: ${c.oldValue ?? "—"} → ${c.newValue ?? "—"}`).join("; "),
      r.ipAddress,
    ]
      .map(escape)
      .join(","),
  );

  const filename = `audit-${formatManila(new Date(), "yyyyMMdd-HHmm")}.csv`;
  return new Response(`﻿${[header.map(escape).join(","), ...lines].join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
