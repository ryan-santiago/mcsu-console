# Staff Augmentation

## Purpose
Track employees deployed to clients: who is where, until when, and which contracts need renewal.

## Routes
- `/staff-augmentation`: engagements list + a **Renewals** board (columns: Renewal ≤30d · ≤45d · Ongoing · Ended · No project)
- `/staff-augmentation/[id]`: engagement detail: assigned employees with live level, position, client/project, dates and renewal status

## Permissions & scope
`staff_aug.view` (scoped by the employee's team), `staff_aug.manage` (create engagements, add/remove assignments). Editing deployment dates from here requires `employee.update` in scope (the deployment belongs to the employee).

## Data
`StaffAugEngagement`, `StaffAugAssignment`. Everything else is read live from `EmployeeEmployment` and `EmployeeDeployment`.

## Business rules
- **Renewal status** is derived from the latest deployment `endDate` (logic ported from mcsu-app `src/lib/staff-augmentation-status.ts`). Thresholds come from `AppSetting` (default 45 and 30 days).
- Daily cron: email the Solutions Manager or Sales Rep (from the S3P project) and the team leads when an assignment crosses a threshold. Each threshold notifies once.
- Contract documents (SOW, PO) attach to the deployment (Phase 2.4 storage).

## Acceptance criteria
- [ ] The renewal board counts match the employee list filter "renewals ≤45d" for the same scope.
- [ ] Reminder emails fire once per threshold crossing.
