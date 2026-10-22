# Settings & Profile

## Purpose
Self-service for every signed-in user, plus organization settings for admins.

## Routes
`/settings` with tabs:
- **Profile:** if linked to an employee: employee profile (read-only), employment and deployment history (read-only), and a "Request change" form. If not linked: name and avatar.
- **Security:** change password, active sessions (revoke others), 2FA ([Q7](../08-open-questions.md)).
- **Appearance:** mode (Light · Dark · System) + palette swatches (QSERV Blue · Ember · Midnight · Graphite) + density (Comfortable/Compact). Saved to `User.preferences`.
- **Organization** (only with `settings.manage`): org name, allowed email domains, MAR reminder day, renewal reminder thresholds (45/30 days). Stored in `AppSetting`.

## Permissions & scope
Profile, Security and Appearance need no permission. Organization needs `settings.manage`. Approving change requests uses `employee.update` within scope.

## Business rules
- A profile change request creates `EmployeeChangeRequest(PENDING)` with a field diff. Only one pending request per employee. The user can cancel it.
- Reviewers see requests in **Employees → Change requests** (scoped). Approving applies the changes in a transaction and audits it.
- Changing the password revokes other sessions.

## Acceptance criteria
- [ ] Theme and palette persist across devices (DB) and don't flash on load (cookie + `next-themes` script).
- [ ] An employee can't edit their profile directly. A change request is required.
- [ ] A Team Lead sees change requests only for their teams' employees.
