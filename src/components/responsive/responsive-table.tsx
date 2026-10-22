import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * One column definition, two layouts (docs/09 §3): a table on ≥ md, a card list on phones.
 * On cards, the `primary` column is the title, `meta` columns are the second line, and the
 * `status` column is a pill in the corner. Server-renderable (no client JS).
 */
export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Card role on phones. Columns without a role are hidden on cards. */
  mobile?: "primary" | "meta" | "status";
  className?: string;
};

export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty: ReactNode;
  caption?: string;
}) {
  if (rows.length === 0) {
    return <div className="rounded-2xl border bg-card p-8 text-center">{empty}</div>;
  }

  const primary = columns.find((c) => c.mobile === "primary");
  const status = columns.find((c) => c.mobile === "status");
  const meta = columns.filter((c) => c.mobile === "meta");

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
        <Table>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <TableHeader className="sticky top-0 bg-card">
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={rowKey(row)} className="h-11 hover:bg-muted/40">
                {columns.map((c) => (
                  <TableCell key={c.key} className={cn("align-top", c.className)}>
                    {c.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-2 md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={rowKey(row)} className="min-h-14 rounded-2xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 font-medium">{primary?.cell(row)}</div>
              {status ? <div className="shrink-0">{status.cell(row)}</div> : null}
            </div>
            {meta.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {meta.map((c) => (
                  <span key={c.key}>{c.cell(row)}</span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
