-- Constraints Prisma can't express (docs/04-data-model.md § Data rules).

-- One ACTIVE sprint per One-Lot workspace.
CREATE UNIQUE INDEX "sprint_one_active" ON "sprint" ("oneLotProjectId") WHERE "status" = 'ACTIVE';

-- Exactly one default group (assigned on approval).
CREATE UNIQUE INDEX "group_one_default" ON "group" ("isDefault") WHERE "isDefault";

-- One PENDING profile change request per employee.
CREATE UNIQUE INDEX "change_request_one_pending" ON "employee_change_request" ("employeeId") WHERE "status" = 'PENDING';

-- Case-insensitive uniqueness for emails (values are also stored lowercased by the app).
CREATE UNIQUE INDEX "user_email_lower_key" ON "user" (lower("email"));
CREATE UNIQUE INDEX "employee_work_email_lower_key" ON "employee" (lower("workEmail"));
