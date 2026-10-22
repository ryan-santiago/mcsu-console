# Notifications & Inbox

## Purpose
**Every event that needs someone's attention creates a notification**: anything to approve, review or act on, plus outcomes people are waiting for. No approval queue relies on people remembering to check a page.

Two kinds:
- **ACTION**: someone must do something (approve a registration, review a change request, send a MAR). It stays in the **Inbox** until it's **resolved**, and when **anyone** acts on it, it's resolved for **every** recipient.
- **INFO**: an outcome or FYI (your change request was approved, you were assigned an item). Cleared by being read.

## Routes
- Top bar 🔔 popover (unread count, latest 10) on every page
- `/inbox`: tabs **To do** (open ACTION items) · **Notifications** (everything, read/unread). On phones this is the **Inbox** bottom tab ([09 §4](../09-mobile-and-pwa.md#4-phone-first-flows))
- `/settings?tab=notifications`: per-category email (and later push) toggles

## Permissions & scope
None needed: everyone sees only **their own** notifications. Recipients are worked out **when the event happens**, using the same policy code as everything else. For example, "holders of `employee.review_changes` whose scope covers this employee" goes through `recipientsFor(permission, entity)` in `src/server/notifications/recipients.ts`. Opening a notification follows a normal link, so authorization applies again. If the recipient has lost access since then, they get the usual 404.

## Event catalog
The catalog lives in code at `src/lib/notifications/catalog.ts`, the same way permissions do. Every new module adds its events here.

| Event | Kind | Recipients | Resolved when | Phase |
|---|---|---|---|---|
| `user.registered` | ACTION | holders of `user.approve` | user approved or rejected | 1.7 |
| `user.approved` | INFO | the user (email, since they can't sign in yet) | — | 1.7 |
| `user.group_changed` / `user.suspended` | INFO | the user (email) | — | 1.7 |
| `team.lead_assigned` | INFO | the new lead | — | 1.8 |
| `employee.change_requested` | ACTION | `employee.review_changes` in scope (never the requester) | approved, rejected or cancelled | 1.9 |
| `employee.change_reviewed` | INFO | requester | — | 1.9 |
| `mar.missing_days` (cron) | ACTION | employee | the missing days are logged | 2.1 |
| `mar.not_sent` (cron) | ACTION | employee whose previous month's MAR is still Draft | MAR finalized | 2.1 |
| `mar.ack_pending` (cron) | ACTION | employee, N days after sending with no acknowledgment recorded | acknowledgment recorded | 2.1 |
| `mar.reopened` | ACTION | employee (when someone else reopens it) | MAR finalized again | 2.1 |
| `renewal.threshold` (cron) | ACTION | team leads in scope + Solutions Manager / Sales Rep (email only, they may not be users) | deployment extended or ended | 2.2 |
| `onelot.added_as_member` | INFO | the user | — | 2.3 |
| `workitem.assigned` / `workitem.mentioned` | INFO | assignee / mentioned user | — | 2.3 |
| `ticket.*` | per Managed Services spec | | | 3 |

## Delivery
| Channel | When | Notes |
|---|---|---|
| In-app | always | The only channel that's always on |
| Email | ACTION items: on by default. INFO: per-category opt-in | Microsoft Graph, one shared sender ([ADR 0009](../adr/0009-staff-and-client-accounts.md)). Sent after the transaction commits |
| Web Push | Phase 2.6, opt-in | [09 §5.4](../09-mobile-and-pwa.md#54-push-notifications-phase-26) |

## Data
`Notification` (one row per recipient), see [schema](../reference/schema.draft.prisma).
- `dedupeKey` (unique) makes cron reminders fire once, e.g. `renewal:<deploymentId>:45:<recipient>`.
- Non-user recipients (Sales Rep, Solutions Manager) get a row with `recipientEmail` and no `recipientId`, as an email log.

## Business rules
- Notifications are created **inside the same transaction** as the change that causes them (`notify()` is passed to `authedAction` handlers next to `audit()`). Email and push go out **after** the commit, so a rolled-back change never sends anything.
- When an ACTION is resolved, every open notification for that entity and event gets `resolvedAt` in the same transaction.
- **No sensitive data in notifications:** no salary or financials, just the title, a short text and a link. The same goes for email and push payloads.
- Kept for 1 year, then purged by the audit archive job (Phase 3).

## Acceptance criteria
- [ ] A new registration appears in the To-do of every `user.approve` holder. Once one of them approves it, it disappears for all of them.
- [ ] A Team Lead gets `employee.change_requested` only for their teams' employees.
- [ ] A renewal reminder is sent once per deployment per threshold, even if the cron runs twice.
- [ ] A rolled-back action creates no notification and sends no email.
