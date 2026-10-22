# Activity Reports & Monthly Activity Report (MAR)

## Purpose
Employees log daily activities. Each month the days roll up into a **Monthly Activity Report**. The employee finalizes it as a PDF and **emails it to the client themselves**. The client signs or acknowledges it **by email, outside the console**. The employee then records that acknowledgment. The MAR supports Staff Augmentation billing.

There is **no internal approval step** (decided in Q4, 2026-10-22). Team Leads monitor progress and can reopen a MAR to fix mistakes.

## Routes
- `/activity-reports`: **My reports**: month calendar with a status per day + list. Quick "Log today" (also in the sidebar CTA card)
- `/activity-reports/new`, `/activity-reports/[id]`
- `/activity-reports/monthly/[year]/[month]`: my MAR: preview → **Finalize & download PDF** → **Record client acknowledgment**
- `/activity-reports/monitoring`: scoped monitoring: who has or hasn't logged, MAR status per employee (Draft / Sent / Acknowledged), bulk export

## Permissions & scope
| Key | Scoped | Allows |
|---|---|---|
| `activity_report.submit` | — | Log own daily reports, finalize own MAR, record its client acknowledgment (Employee group has this) |
| `activity_report.view` | ✅ | OWN = mine. TEAM = my teams' employees. ALL = everyone |
| `activity_report.reopen` | ✅ | Reopen a `SENT` or `ACKNOWLEDGED` MAR back to `DRAFT` (with a required reason), and record an acknowledgment on the employee's behalf |
| `activity_report.export` | ✅ | Generate PDFs / monitoring exports in scope |

## Data
`ActivityReport` (one per employee per day) + `ActivityReportItem[]`. `MonthlyActivityReport` is the status envelope:

```
DRAFT ──finalize──▶ SENT ──record ack──▶ ACKNOWLEDGED
  ▲                  │                      │
  └──── reopen (activity_report.reopen, reason required) ──┘
```

- **Finalize** (`DRAFT → SENT`): checks there are no missing working days (or the employee confirms each gap), renders the PDF, stores a frozen copy (`pdfStorageKey`), sets `sentAt`, and offers the download. The employee emails the PDF to the client from their own mailbox. The console doesn't send it.
- **Record acknowledgment** (`SENT → ACKNOWLEDGED`): `acknowledgedAt` (the date of the client's email), an optional note (e.g. the client signatory's name), and an optional attachment: the client's reply saved as `.eml`/`.msg`/PDF, or the signed PDF (`ackStorageKey`).
- **Reopen** (`SENT | ACKNOWLEDGED → DRAFT`): clears `sentAt`/`acknowledgedAt`. It keeps the old frozen PDF as history in the audit log and stores the reason in `reopenReason`.

## Business rules
- Daily: one report per day. `PRESENT` requires time in/out and ≥1 item. `ON_LEAVE`/`HOLIDAY` don't need items.
- Daily reports in a month are **locked** while the MAR is `SENT` or `ACKNOWLEDGED`. Reopening unlocks them.
- The MAR header (client, project) is taken from the deployment active in that month.
- The frozen PDF is stored at finalize time, so what the client received can always be downloaded again unchanged. The SharePoint `DocumentStorage` driver ships in this milestone (2.1), since this is its first consumer ([ADR 0007](../adr/0007-sharepoint-document-storage.md)).
- "Missing days" are working days (weekdays not in the **Holidays** lookup) inside the employee's deployment period with no `ActivityReport` row.
- The PDF is rendered server-side with `@react-pdf/renderer`. Layout and fields are ported from mcsu-app `activity-report-pdf-template.ts` (employee, client, project, month, daily rows, client signatory block).
- Notifications ([notifications](notifications.md)), sent by a daily cron ([11 §7](../11-aws-deployment.md#7-scheduled-jobs)):
  - `mar.missing_days`: on each of the last `mar.missingDaysReminderWorkingDays` (default 3) working days of the month, to employees with missing days.
  - `mar.not_sent`: on day `mar.sendReminderDay` (default 3), to employees whose previous month's MAR is still `DRAFT`.
  - `mar.ack_pending`: `mar.ackReminderDays` (default 7) days after `sentAt`, to the employee, if it's still `SENT`.
  - `mar.reopened`: to the employee when someone else reopens their MAR.

## Acceptance criteria
- [ ] An employee can only ever see and edit their own reports.
- [ ] A Team Lead's monitoring page lists only their teams' employees, with Draft / Sent / Acknowledged counts.
- [ ] The finalized MAR PDF is byte-identical when downloaded again after the MAR is reopened and daily rows change (the old copy stays in history).
- [ ] An employee can't edit a day in a `SENT` month until the MAR is reopened.
