# 0005 · Fresh start: no data migration from mcsu-app

**Status:** Accepted · 2026-10-21

## Decision
MCSU Console starts with an empty database seeded with the permission catalog, groups, base lookups and one Super Admin. Data is not copied from mcsu-app. An optional CSV importer may be added in Phase 2 (Q13).

## Consequences
- ➕ No legacy permission strings, orphan rows or schema compromises.
- ➖ Teams, employees and projects must be entered again. Plan a data-entry week before go-live.
