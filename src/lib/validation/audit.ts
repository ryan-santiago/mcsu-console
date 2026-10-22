import { z } from "zod";

/** /admin/audit filters, kept in the URL (AGENTS.md §5). Shared by the page and the CSV export. */
export const auditFiltersSchema = z.object({
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
  module: z.string().trim().max(50).optional().catch(undefined),
  action: z.string().trim().max(50).optional().catch(undefined),
  actor: z.string().trim().max(200).optional().catch(undefined),
  q: z.string().trim().max(200).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1).default(1),
  size: z.coerce
    .number()
    .refine((n) => [25, 50, 100].includes(n))
    .catch(25)
    .default(25),
});

export type AuditFilters = z.infer<typeof auditFiltersSchema>;

/** Flatten Next's searchParams (string | string[]) to first values before parsing. */
export function parseAuditFilters(
  raw: Record<string, string | string[] | undefined>,
): AuditFilters {
  const flat = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || undefined]),
  );
  return auditFiltersSchema.parse(flat);
}
