import { Download, History } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { RelativeTime } from "@/components/notifications/relative-time";
import { ResponsiveTable, type Column } from "@/components/responsive/responsive-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auditActionLabel, auditActionTone, auditModuleLabel } from "@/lib/audit-registry";
import { cn } from "@/lib/utils";
import { parseAuditFilters, type AuditFilters } from "@/lib/validation/audit";
import { listAuditFacets, listAuditLog, type AuditRowDTO } from "@/server/audit/queries";

export const metadata: Metadata = { title: "Audit Trail" };

const TONE: Record<ReturnType<typeof auditActionTone>, string> = {
  destructive: "bg-destructive-soft text-destructive",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
};

const COLUMNS: Column<AuditRowDTO>[] = [
  {
    key: "time",
    header: "Time",
    mobile: "meta",
    className: "whitespace-nowrap",
    cell: (r) => <RelativeTime iso={r.createdAt} className="text-sm" />,
  },
  {
    key: "actor",
    header: "Actor",
    mobile: "meta",
    cell: (r) => (
      <span className="block min-w-0">
        <span className="block truncate text-sm">{r.actorName ?? r.actorEmail ?? "System"}</span>
        {r.actorName && r.actorEmail ? (
          <span className="block truncate text-xs text-muted-foreground">{r.actorEmail}</span>
        ) : null}
      </span>
    ),
  },
  {
    key: "module",
    header: "Module",
    cell: (r) => (
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
        {auditModuleLabel(r.module)}
      </span>
    ),
  },
  {
    key: "action",
    header: "Action",
    mobile: "status",
    cell: (r) => (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          TONE[auditActionTone(r.action)],
        )}
      >
        {auditActionLabel(r.action)}
      </span>
    ),
  },
  {
    key: "entity",
    header: "Entity",
    mobile: "primary",
    cell: (r) => <span className="text-sm">{r.entityLabel ?? r.entityId ?? "—"}</span>,
  },
  {
    key: "changes",
    header: "Changes",
    cell: (r) =>
      r.changes.length === 0 ? (
        <span className="text-sm text-muted-foreground">—</span>
      ) : (
        <details className="text-sm">
          <summary className="cursor-pointer text-primary">
            {r.changes.length} field{r.changes.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 space-y-1">
            {r.changes.map((c) => (
              <li key={c.field}>
                <span className="font-medium">{c.label}:</span>{" "}
                <span className="text-muted-foreground line-through">{c.oldValue ?? "—"}</span> →{" "}
                <span>{c.newValue ?? "—"}</span>
              </li>
            ))}
          </ul>
        </details>
      ),
  },
  {
    key: "ip",
    header: "IP",
    cell: (r) => (
      <span className="font-mono text-[11px] text-muted-foreground">{r.ipAddress ?? "—"}</span>
    ),
  },
];

function queryString(
  filters: AuditFilters,
  overrides: Partial<Record<keyof AuditFilters, string | number>>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...overrides })) {
    if (
      value !== undefined &&
      value !== "" &&
      !(key === "page" && value === 1) &&
      !(key === "size" && value === 25)
    ) {
      params.set(key, String(value));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const filters = parseAuditFilters(await searchParams);
  const [{ total, rows }, facets] = await Promise.all([listAuditLog(filters), listAuditFacets()]);
  const pages = Math.max(1, Math.ceil(total / filters.size));

  return (
    <>
      <PageHeader
        title="Audit Trail"
        description="Who changed what and when. Entries can't be edited or deleted."
        actions={
          <Button asChild variant="outline">
            <a href={`/api/audit/export${queryString(filters, {})}`}>
              <Download aria-hidden /> Export CSV
            </a>
          </Button>
        }
      />

      <form
        method="get"
        className="mb-4 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="space-y-1.5">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" defaultValue={filters.from} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" defaultValue={filters.to} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="module">Module</Label>
          <select
            id="module"
            name="module"
            defaultValue={filters.module ?? ""}
            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="">All modules</option>
            {facets.modules.map((m) => (
              <option key={m} value={m}>
                {auditModuleLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="action">Action</Label>
          <select
            id="action"
            name="action"
            defaultValue={filters.action ?? ""}
            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="">All actions</option>
            {facets.actions.map((a) => (
              <option key={a} value={a}>
                {auditActionLabel(a)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="actor">Actor</Label>
          <Input id="actor" name="actor" placeholder="Name or email" defaultValue={filters.actor} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="q">Search</Label>
          <Input id="q" name="q" placeholder="Entity, id or IP" defaultValue={filters.q} />
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <Button type="submit">Apply filters</Button>
          <Button asChild variant="ghost">
            <Link href="/admin/audit">Reset</Link>
          </Button>
          <span className="ml-auto self-center text-sm text-muted-foreground">
            {total.toLocaleString()} entr{total === 1 ? "y" : "ies"}
            {!filters.from ? " · last 30 days" : ""}
          </span>
        </div>
      </form>

      <ResponsiveTable
        caption="Audit entries"
        columns={COLUMNS}
        rows={rows}
        rowKey={(r) => r.id}
        empty={
          <div className="space-y-2 text-muted-foreground">
            <History className="mx-auto size-8" aria-hidden />
            <p className="text-sm">No audit entries match these filters.</p>
          </div>
        }
      />

      {pages > 1 ? (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-2">
          <Button asChild variant="outline" size="sm" aria-disabled={filters.page <= 1}>
            <Link
              href={`/admin/audit${queryString(filters, { page: Math.max(1, filters.page - 1) })}`}
              className={filters.page <= 1 ? "pointer-events-none opacity-50" : undefined}
            >
              Previous
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {filters.page} of {pages}
          </span>
          <Button asChild variant="outline" size="sm" aria-disabled={filters.page >= pages}>
            <Link
              href={`/admin/audit${queryString(filters, { page: Math.min(pages, filters.page + 1) })}`}
              className={filters.page >= pages ? "pointer-events-none opacity-50" : undefined}
            >
              Next
            </Link>
          </Button>
        </nav>
      ) : null}
    </>
  );
}
