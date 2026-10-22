# Employees

## Purpose
The single source of truth for people: profile, addresses, employment history (position/level/type/compensation) and deployment history (client/project).

## Routes
- `/employees`: list (table ⇄ cards), filters in the URL
- `/employees/new`
- `/employees/[id]`: tabs **Overview · Employment · Deployments · Activity Reports · Activity (audit)**
- `/employees/change-requests`: review queue (scoped by `employee.review_changes`)

## Permissions & scope
| Key | Scoped | Notes |
|---|---|---|
| `employee.view` | ✅ | Lists and detail pages filtered by `scopeWhere` |
| `employee.view_compensation` | ✅ | Salary/allowances columns and fields. Otherwise hidden in the DTO, not just the UI |
| `employee.create` | — | New employees. The team selector is limited to teams in the creator's `employee.update` scope |
| `employee.update` | ✅ | Profile, addresses, employment, deployments |
| `employee.review_changes` | ✅ | Approve or reject self-service change requests (`/employees/change-requests`). Approving applies only the requested fields, so the reviewer doesn't need `employee.update` |
| `employee.deactivate` / `employee.restore` | ✅ / — | Soft delete (`deletedAt`) |
| `employee.export` | ✅ | CSV/XLSX of the scoped list |

**Scope examples:**
- Administrator (ALL): every employee.
- Team Lead of *Java Team* and *QA Team* (TEAM): employees whose `teamId` is one of those two, plus themselves. That **includes salary and allowances** (`employee.view_compensation@TEAM`, decided in Q9), but not editing them. They also review their teams' profile change requests (`employee.review_changes@TEAM`), never their own.
- Employee (OWN): only themselves (their own record opens read-only, with a "Request change" link to Settings).

## Screens
- **List:**
  - Columns: Code, Name (+ avatar), Position · Level, Team, Employment type, Client / Project (current deployment), Status (Active / Resigned / Bench).
  - Filters: search, team, client, employment type, status, include resigned.
  - Toolbar: export, New.
  - KPI strip on top: headcount, deployed, bench, renewals ≤45d (all scoped).
- **Detail:** header card (photo, name, code, position, team, contact chips, status) + tabs. Employment and deployment tables with add/edit/delete dialogs (ported from mcsu-app `employment-history-table.tsx`, `deployment-history-table.tsx`).
- **Form:** sections for Personal, Contact, Team, Addresses (PSGC picker ported from `ph-address-picker.tsx`), and initial Employment.

## Data
`Employee`, `EmployeeAddress`, `EmployeeEmployment`, `EmployeeDeployment`, `EmployeeChangeRequest`. See [04-data-model.md](../04-data-model.md).

## Business rules
- `workEmail` is unique and lowercase. Creating an employee auto-links an existing user with the same email.
- Adding an employment record with no `endDate` closes the previous open record (`endDate = newStart − 1 day`), in one transaction.
- A deployment's `projectId` must belong to the selected `clientId`.
- Current position, team, client and status are derived (see data model). Nothing is denormalized.
- Changing an employee's `teamId` requires `employee.update` scope over **both** the old and the new team.
- Users can't edit their **own** employee record through this module, even with ALL scope. They use the change-request flow.

## Acceptance criteria
- [ ] Team Lead A can't open `/employees/<id of Team B member>` (404).
- [ ] An employee without `view_compensation` never receives salary values in the RSC payload (checked in an e2e network assertion).
- [ ] The list, export and dashboard counts agree for the same scope.
