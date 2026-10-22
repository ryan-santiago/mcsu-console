# Settings & Profile

## Purpose
Self-service for every signed-in user, plus organization settings for admins.

## Routes
`/settings` with tabs:
- **Profile:** if linked to an employee: employee profile (read-only), employment and deployment history (read-only), and a "Request change" form. If not linked: name and avatar.
- **Security:** change password, active sessions (revoke others), 2FA ([Q7](../08-open-questions.md)).
- **Appearance:** mode (Light · Dark · System) + palette swatches (QSERV Blue · Ember · Midnight · Graphite) + density (Comfortable/Compact). Saved to `User.preferences`.
- **Organization** (only with `settings.manage`): org name, allowed email domains, and reminder settings. Stored in `AppSetting`:

  | Key | Default | Used by |
  |---|---|---|
  | `org.name` | `QSERV – MCSU` | Emails, PDF headers |
  | `auth.allowedEmailDomains` | `["questronix.com.ph"]` | Registration (Q8) |
  | `mar.missingDaysReminderWorkingDays` | `3` | MAR missing-days reminder: the last N working days of the month |
  | `mar.sendReminderDay` | `3` | Day of month employees are reminded if last month's MAR is still Draft |
  | `mar.ackReminderDays` | `7` | Days after sending before reminding the employee to record the client's acknowledgment |
  | `staffAug.renewalThresholds` | `{ soon: 45, urgent: 30 }` | Renewal status and reminders |

  "Working days" exclude weekends and dates in the **Holidays** lookup (Maintenance).

## Permissions & scope
Profile, Security and Appearance need no permission. Organization needs `settings.manage`. Reviewing change requests needs `employee.review_changes` within scope.

## Business rules
- A profile change request creates `EmployeeChangeRequest(PENDING)` with a field diff. Only one pending request per employee. The user can cancel it.
- Reviewers (`employee.review_changes` in scope) see requests in **Employees → Change requests**. Nobody can review their own request. Approving applies the changes in a transaction and audits it.
- Changing the password revokes other sessions.

## Acceptance criteria
- [ ] Theme and palette persist across devices (DB) and don't flash on load (cookie + `next-themes` script).
- [ ] An employee can't edit their profile directly. A change request is required.
- [ ] A Team Lead sees change requests only for their teams' employees.
