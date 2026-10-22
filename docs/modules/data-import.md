# Data Import (CSV / Excel)

## Purpose
Load existing **Employees** and **Projects (S3P)** in bulk instead of typing them in during the pre-go-live data-entry week ([ADR 0005](../adr/0005-fresh-start-no-migration.md), Q13). This is an importer, not a migration: there's no connection to `mcsu-app`.

## Routes
- `/employees/import` and `/projects/import`: a 3-step wizard: **Download template → Upload → Review & import**

## Permissions & scope
| Import | Requires |
|---|---|
| Employees | `employee.create` **and** `employee.view_compensation` at `ALL` (the template includes the initial salary). Every row's team must be within the importer's `employee.update` scope |
| Projects | `project.create` **and** `project.view_financials` at `ALL` (contract lines include price/cost). Teams must be within `project.update` scope |

## Templates
- Downloadable as **`.xlsx`** (with a header row, column notes, data-validation dropdowns for lookups, and an example row) and **`.csv`** (UTF-8, header row only). Generated on the fly, so the dropdowns always reflect current active lookups.
- **Employees:** code, first/middle/last name, suffix, gender, birth date, work email, personal email, mobile, team, hire date, position, level, employment type, salary, allowances, employment start date, current address (PSGC codes or names), and an optional current deployment (client, S3P number, start/end).
- **Projects:** S3P number, name, client, engagement type, sales rep, solutions manager, start/end date, teams (`;`-separated), and contract lines on a second sheet (`S3P number, description, contract price, estimated cost`). CSV import of projects uses two files.

## Business rules
- **Validate everything first (dry run).** Each row is parsed with the module's Zod create schema plus import checks. The review screen shows ✅ new · ⏭ skipped (already exists) · ❌ error rows, with the column and message. You can download the error rows as a file, fix them and re-upload.
- **Existing records are skipped, never updated** (same rule as the seed): employees matched on `workEmail`, projects on `s3pNumber`.
- **Lookups are matched by name** (case-insensitive, trimmed) and must exist and be active. Unknown values are errors. Add them in Maintenance first, and the error tells you which ones.
- **Import is all-or-nothing:** the valid rows are written in **one transaction**. If anything fails at commit time, nothing is written.
- Audit: one `import` entry (file name, counts) plus a normal `create` audit entry per record. Auto-linking of users by work email applies as in a normal create.
- Limits: 5 MB, 2,000 rows per file. Parsing is done on the server (`exceljs` for `.xlsx`, `papaparse` for `.csv`). Formulas are read as their cached values, and macros (`.xlsm`) are rejected.

## Acceptance criteria
- [ ] Downloading the template and re-uploading it unchanged reports 0 errors and creates nothing (the example row is marked and ignored).
- [ ] A row with an unknown team is rejected with "Team 'X' not found", and no rows are written until it's fixed.
- [ ] Re-importing the same file skips every row (0 created).
- [ ] A Team Lead can't import (no `employee.create`).
