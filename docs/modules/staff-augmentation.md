# Staff Augmentation

## Purpose
Track employees deployed to clients: who is where, until when, and which contracts need renewal.

This module **has no tables of its own**. It's a view over `EmployeeDeployment` rows whose S3P project has the *Staff Augmentation* engagement type. There's one source of truth for "who is deployed where" (decided 2026-10-22; the earlier `StaffAugEngagement`/`StaffAugAssignment` models were dropped because they duplicated deployments).

## Routes
- `/staff-augmentation`: deployments list (grouped by client, filterable by client, project, team and renewal status) + a **Renewals** board (columns: Urgent ≤30d · Soon ≤45d · Ongoing · Ended · No project, with thresholds from `AppSetting`)
- Clicking a row opens the employee's **Deployments** tab (`/employees/[id]?tab=deployments`), where deployments are edited

## Permissions & scope
`staff_aug.view` (scoped by the employee's team, see [03-rbac.md §4](../03-rbac.md#4-scope-semantics)). There's no `staff_aug.manage`: creating or editing a deployment is an employee change and needs `employee.update` in scope.

## Data
Read-only over `EmployeeDeployment` + `Project` (engagement type, Solutions Manager, Sales Rep) + `Employee` + the current `EmployeeEmployment` (level, position).

## Business rules
- **Renewal status** is derived from the latest deployment `endDate` (logic ported from mcsu-app `src/lib/staff-augmentation-status.ts`): `NO_PROJECT`, `ONGOING`, `RENEWAL_SOON` (≤ `staffAug.renewalThresholds.soon`, default 45 days), `RENEWAL_URGENT` (≤ `…urgent`, default 30), `ENDED`.
- Daily cron ([11 §7](../11-aws-deployment.md#7-scheduled-jobs)): email the Solutions Manager or Sales Rep (from the S3P project) and the team leads when a deployment crosses a threshold. Each threshold notifies once per deployment (via the `Notification.dedupeKey`, see [notifications](notifications.md)).
- Contract documents (SOW, PO) attach to the deployment through `DocumentStorage` (available from milestone 2.1).

## Acceptance criteria
- [ ] The renewal board counts match the employee list filter "renewals ≤45d" for the same scope.
- [ ] Reminder emails fire once per threshold crossing.
- [ ] A Team Lead sees only their teams' deployments (plus their own).
