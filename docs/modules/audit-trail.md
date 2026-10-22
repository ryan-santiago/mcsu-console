# Audit Trail

## Purpose
An immutable record of who changed what and when.

## Routes
`/admin/audit` (filters in the URL), plus an **Activity** tab on entity detail pages (Employee, Project, One-Lot), filtered by `entityId`.

## Permissions & scope
`audit.view` (global). The entity Activity tabs are visible to anyone who can view the entity, but show only that entity's entries.

## Screens
- A table with Time (relative + tooltip absolute), Actor (avatar + name/email), Module badge, Action badge, Entity label (link if it still exists), Changes (expandable "field: old → new" diff), IP.
- Filters: date range (default last 30 days), module, action, actor, free-text search. Page size 25/50/100. Export CSV (≤ 5,000 rows).

## Data
`AuditLog` (append-only). `src/lib/audit.ts` (`recordAudit`, `diffFields`) and `src/lib/audit-registry.ts` (module/action labels), ported from mcsu-app.

## Business rules
- No update or delete API for audit rows. Retention is 3 years; a cron job archives older rows (Phase 3).
- Sensitive fields are masked (salary, tokens). Passwords are never logged.

## Acceptance criteria
- [ ] Every mutation in Phase 1 modules produces exactly one audit row with correct diffs.
- [ ] Login, logout and failed logins are recorded.
