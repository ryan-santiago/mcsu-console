# Users (User Management)

## Purpose
Approve registrations, assign groups, suspend or reactivate accounts, and link accounts to employee records.

## Routes
- `/register`, `/login`, `/forgot-password`, `/reset-password`, `/pending`
- `/admin/users` (tabs: **Active · Pending · Suspended**; `?tab=pending` deep link; the sidebar badge shows the pending count to `user.approve` holders)

## Permissions & scope
| Key | Allows |
|---|---|
| `user.view` | See the user list |
| `user.approve` | Approve or reject pending users |
| `user.update` | Change group, suspend/reactivate, link/unlink employee, revoke sessions |
| `user.delete` | Delete a user (only if no audit-significant ownership; otherwise suspend) |

Rank rules R2–R4, R8–R11 from [03-rbac.md](../03-rbac.md#5-policy-rules) apply to every action.

## Screens
- **User list:** table with Identity, Group (badge + mono rank), Status pill, Last login, Created, and an actions menu.
  - **Identity cell:** if the user is linked to an employee, show avatar/photo, full name, `position · team` and the email underneath. If not, show an initials avatar, the registered name and the email, plus a muted "No employee record" chip.
- **Approve dialog:** shows the matched employee (if found by email) or "No matching employee". Group select lists **only groups with rank > yours**, with `Employee` preselected. An optional "Link to employee" picker is shown when there's no auto-match.
- **Change group dialog:** same group filter. It warns: "User will be signed out of all sessions."
- Disabled actions (higher or equal rank, self) are shown with a tooltip explaining why.

## Data
`User`, `Session`, `Account` (Better Auth). `User.status`, `User.groupId`, `User.employeeId`, `approvedAt/By`, `lastLoginAt`.

## Business rules
1. On registration: lowercase the email, check the allowed domains ([Q8](../08-open-questions.md)), create a `PENDING` user with `groupId = null`, and auto-link the employee where `workEmail` matches.
2. Better Auth `session.create.before` hook: only `ACTIVE` users get sessions. Pending users are redirected to `/pending`.
3. On approve: set `ACTIVE`, the group, `approvedAt/By`; audit `user.approve`; email "Your account is approved".
4. On reject: delete the pending user and audit it (keep the email in the audit log).
5. On suspend or group change: revoke all sessions in the same transaction (R10).
6. Linking an employee is unique: one employee maps to at most one user. When an Employee is created later with a matching work email, link it automatically.

## Security
- **Allowed domains:** self-registration is rejected unless the email domain is in `AppSetting auth.allowedEmailDomains` (default `["questronix.com.ph"]`). Client users never self-register. They're invited ([ADR 0009](../adr/0009-staff-and-client-accounts.md)).
- The User Management list gets a **Type** filter (Staff · Client) in Phase 3.
- **2FA:** TOTP is mandatory for rank ≤ 10 (Super Admin, Administrator). A user in those groups without 2FA is forced to `/settings/security/2fa-setup` before anything else. Backup codes are issued at setup. Assigning someone to a rank ≤ 10 group requires them to enrol on their next login.
- Login, registration and password reset are rate-limited.

## Acceptance criteria
- [ ] A Manager (rank 20) can't see "Change group" enabled for an Administrator (10) or another Manager (20).
- [ ] The approve dialog never lists a group with rank ≤ the approver's rank.
- [ ] A suspended user is logged out on their very next request.
- [ ] The last active Super Admin can't be suspended, deleted or moved.
- [ ] A user with a matching employee shows employee details. Otherwise their email is shown.
- [ ] Registering with a non-allowed domain fails with a clear message.
- [ ] An Administrator without 2FA can't reach any page except 2FA setup.
