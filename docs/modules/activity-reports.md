# Activity Reports & Monthly Activity Report (MAR)

## Purpose
Employees log daily activities. Each month the days roll up into a **Monthly Activity Report**, which is submitted, reviewed, approved, and exported as a PDF for the client (Staff Augmentation billing support).

## Routes
- `/activity-reports`: **My reports**: month calendar with a status per day + list. Quick "Log today" (also in the sidebar CTA card)
- `/activity-reports/new`, `/activity-reports/[id]`
- `/activity-reports/monthly/[year]/[month]`: my MAR: preview, submit, PDF
- `/activity-reports/monitoring`: scoped monitoring: who has or hasn't logged, MAR status per employee, bulk export

## Permissions & scope
| Key | Scoped | Allows |
|---|---|---|
| `activity_report.submit` | — | Log own daily reports and submit own MAR (Employee group has this) |
| `activity_report.view` | ✅ | OWN = mine. TEAM = my teams' employees. ALL = everyone |
| `activity_report.approve` | ✅ | Approve or return MARs in scope |
| `activity_report.export` | ✅ | Generate PDFs / monitoring exports in scope |

## Data
`ActivityReport` (one per employee per day) + `ActivityReportItem[]`. `MonthlyActivityReport` is the status envelope (`DRAFT → SUBMITTED → APPROVED | RETURNED`).

## Business rules
- Daily: one report per day. `PRESENT` requires time in/out and ≥1 item. `ON_LEAVE`/`HOLIDAY` don't need items.
- Daily reports in a month are **locked** once the MAR is `SUBMITTED` or `APPROVED`. A `RETURNED` MAR unlocks them.
- The MAR header (client, project) is taken from the deployment active in that month.
- Approval freezes a PDF copy (`pdfStorageKey`) so later edits can't change what the client received.
- The PDF is rendered server-side with `@react-pdf/renderer`. Layout and fields are ported from mcsu-app `activity-report-pdf-template.ts` (employee, client, project, month, daily rows, signatories).
- Reminder cron (Phase 2.6): N working days before month end, notify employees with missing days. On the 3rd, notify approvers of pending MARs.

## Acceptance criteria
- [ ] An employee can only ever see and edit their own reports.
- [ ] A Team Lead's monitoring page lists only their teams' employees.
- [ ] The approved MAR PDF is byte-identical when downloaded again after daily rows change.
