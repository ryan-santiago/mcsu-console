# Maintenance

## Purpose
Reference data for every module, plus **Teams and Team Leads**, which drive TEAM scope.

## Routes
`/admin/maintenance?tab=<kind>`: tabbed view with an overflow menu (layout ported from mcsu-app `maintenance-view.tsx`).

## Permissions & scope
`maintenance.view`, `maintenance.manage`, `team.manage_leads`.

## Lookups
| Tab | Model | Extra fields |
|---|---|---|
| Teams | `Team` | description, **Team Leads** (multi-select employees), member count |
| Clients | `Client` | — |
| Positions | `Position` | — |
| Levels | `Level` | sortOrder |
| Gender | `Gender` | — |
| Employment Types | `EmploymentType` | — |
| Engagement Types | `EngagementType` | — |
| Sales Representatives | `SalesRepresentative` | email |
| Solutions Managers | `SolutionsManager` | email |
| Job Profiles | `JobProfile` | position + level, description, qualifications |
| Holidays | `Holiday` | date, name, type (Regular / Special non-working). Used for working-day calculations (MAR missing days, reminders) |

## Screens
- Generic `LookupTable` (name, active toggle, usage count, edit/delete). Delete is only offered when the usage count is 0; otherwise the row is deactivated.
- **Team detail drawer:** name/description, **Leads** (employee picker, multiple), members list (read-only, from `Employee.teamId`), linked projects.
  - A lead whose user's group lacks any TEAM-scoped grant shows a ⚠ hint ([Q3](../08-open-questions.md)).

## Business rules
- Names are unique (case-insensitive). Inactive lookups are hidden from pickers but still shown on existing records.
- Setting team leads is validated **on the server**: each employee must exist and not be soft-deleted. Changes are audited as `team.update_leads`.
- Changing leads affects scope on the next request (no cache).

## Acceptance criteria
- [ ] A team can have 2+ leads. A lead can lead 2+ teams, and their TEAM scope covers both.
- [ ] Removing a lead immediately removes that team's employees from the lead's lists.
- [ ] A referenced lookup can't be hard-deleted.
