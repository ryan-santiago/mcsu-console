# 08 · Open questions

Each question has a **recommended default**. If nobody objects before the relevant milestone starts, the default is applied. When one is decided, move it to **Decided**, and if it's architectural, add an ADR.

## Decided

| # | Question | Decision | Date | Affects |
|---|---|---|---|---|
| Q1 | Can an employee belong to more than one team? | **No. One primary team** (`Employee.teamId`). Cross-team work is expressed through project ↔ team links and One-Lot membership. | 2026-10-22 | [Data model](04-data-model.md), [Employees](modules/employees.md) |
| Q5 | Document storage | **SharePoint** via Microsoft Graph (existing M365 tenant), behind a `DocumentStorage` interface. Local disk in dev. | 2026-10-22 | [ADR 0007](adr/0007-sharepoint-document-storage.md), [One-Lot](modules/one-lot-projects.md) |
| Q6 | Hosting | **AWS `ap-southeast-1` (Singapore): EC2 + ALB + RDS PostgreSQL 17** (changed from Vercel + Neon). | 2026-10-22 | [ADR 0011](adr/0011-aws-ec2-rds.md), [AWS deployment](11-aws-deployment.md) |
| Q7 | Password policy and MFA | Min 12 chars plus a breached-password check (Better Auth `haveIBeenPwned` plugin). **TOTP 2FA applies only to users linked to an Employee record** (amended 2026-10-22). For them it's mandatory when their group's rank is ≤ 10, and optional otherwise (Settings → Security). Accounts without employee data, such as the `mcsu_automations` Super Admin service account, never use 2FA. | 2026-10-22 | [Users](modules/users.md), [Settings](modules/settings-profile.md) |
| Q8 / Q16 | Restrict registration to company email domains? Which ones? | **Self-registration (staff) is limited to `@questronix.com.ph`** (`AppSetting auth.allowedEmailDomains`, editable). **Clients don't self-register:** they're **invited** from Managed Services as `CLIENT` users tied to their Client (Phase 3). Email-to-ticket needs no account. | 2026-10-22 | [ADR 0009](adr/0009-staff-and-client-accounts.md), [Users](modules/users.md) |
| Q9 | Should Team Leads see salaries? | **Yes, for their own teams.** Team Leads prepare salary-increase recommendations, so the `Team Lead` group gets `employee.view_compensation` at **TEAM** scope (view only). Changing compensation still needs `employee.update`, which Team Lead doesn't hold by default. | 2026-10-22 | [RBAC](03-rbac.md), [Employees](modules/employees.md) |
| Q17 | Data residency outside the Philippines | **Accepted.** Singapore is the closest full AWS region. | 2026-10-22 | [ADR 0011](adr/0011-aws-ec2-rds.md) |
| Q19 | Which AWS account? | **A new dedicated member account in the existing QNX AWS Organization** (`qnx-mcsu-console-staging` and `qnx-mcsu-console-prod`). It inherits the Org's SCPs and consolidated billing, and access goes through the Org's IAM Identity Center. The QNX AWS Org admin creates the account(s). | 2026-10-22 | [AWS deployment §10](11-aws-deployment.md#10-aws-account--organization) |
| Q20 | Who reviews self-service profile change requests? | A new scopable permission **`employee.review_changes`**. Team Lead gets it at TEAM, Manager and Admin at ALL. Reviewing doesn't need `employee.update`, and nobody reviews their own request. | 2026-10-22 | [RBAC](03-rbac.md), [Employees](modules/employees.md), [Settings](modules/settings-profile.md) |
| Q21 | Does Staff Augmentation need its own engagement/assignment tables? | **No.** Staff Aug is a view over `EmployeeDeployment` on Staff-Aug S3Ps. `StaffAugEngagement`, `StaffAugAssignment` and `staff_aug.manage` are dropped. | 2026-10-22 | [Staff Aug](modules/staff-augmentation.md), [Data model](04-data-model.md) |
| Q22 | Can One-Lot membership grant rights beyond group permissions? | **Yes, as the only exception:** OWNER/MEMBER/VIEWER roles inside one workspace. | 2026-10-22 | [ADR 0013](adr/0013-one-lot-resource-roles.md), [RBAC §5b](03-rbac.md#5b-resource-roles-one-lot-membership) |
| Q23 | Does production rebuild the image? | **No.** Build once, promote the digest; public config is read at runtime. | 2026-10-22 | [ADR 0014](adr/0014-build-once-runtime-config.md) |
| Q24 | Seed grant matrix, reminders, storage timing, audience rule, etc. (from the 2026-10-22 docs review) | Recommended defaults applied: grant matrix in [03 §2a](03-rbac.md#2a-seed-grant-matrix), R6 clarified, R14 (audience) and R15 (2FA) added, SharePoint driver in 2.1, daily crons driven by `AppSetting` + `Holiday`, compensation masked in audit at read time, `onelot.delete` = scopable archive. Grant matrix confirmed in Q26. | 2026-10-22 | [RBAC](03-rbac.md), [Roadmap](06-roadmap.md), [AWS §7](11-aws-deployment.md#7-scheduled-jobs) |
| Q25 | Seed strategy and notifications | **One seed script** for all environments: create only what is missing, skip existing records (catalog sync is the only exception). **Every event that needs attention creates a notification** (ACTION items stay in the Inbox until resolved); in-app + email core moves to Phase 1 (milestone 1.5b), Web Push stays in 2.6. | 2026-10-22 | [Data model](04-data-model.md#seed-data-fresh-start), [Notifications](modules/notifications.md) |
| Q2 | Must a Team Lead be an employee record? | **Yes.** `TeamLead` references `Employee`; the lead's user account is found through `User.employeeId`. | 2026-10-22 | [Maintenance](modules/maintenance.md) |
| Q3 | Team lead assigned, but their group only has OWN scope? | They still see only their own data, and Maintenance shows a warning: "This person's group doesn't grant TEAM scope." Group and lead stay independent. | 2026-10-22 | [Maintenance](modules/maintenance.md) |
| Q4 | Who approves the Monthly Activity Report? | **No internal approval.** The employee finalizes the MAR (PDF frozen) and emails it to the client. The client signs or acknowledges by email (manual, outside the console), and the employee records the acknowledgment. Statuses `DRAFT → SENT → ACKNOWLEDGED`. `activity_report.approve` is replaced by `activity_report.reopen`. | 2026-10-22 | [Activity Reports](modules/activity-reports.md), [RBAC](03-rbac.md) |
| Q10 | Can a user edit their own employee profile directly? | **No.** They submit a change request, reviewed by `employee.review_changes` in scope (Q20). | 2026-10-22 | [Settings](modules/settings-profile.md) |
| Q12 | Talent Acquisition, Employee Recommendation, Certifications, Device Inventory, Announcements? | **Yes, in a new Phase 2b**, starting with Employee Recommendation. Stub specs exist; confirm each against mcsu-app before its milestone. | 2026-10-22 | [Roadmap](06-roadmap.md) |
| Q13 | Bring in existing data despite the fresh start? | **CSV/Excel importer** for Employees and Projects, with downloadable templates (milestone 1.12, before go-live). Still no direct migration from mcsu-app. | 2026-10-22 | [Data Import](modules/data-import.md) |
| Q14 | Microsoft SSO? | **No SSO.** Email + password (+ TOTP for employee-linked users at rank ≤ 10). | 2026-10-22 | [Tech stack](02-tech-stack-and-setup.md) |
| Q15 | Can a user approver also be a Team Lead with limited scope? | **Yes.** `user.approve` is global, but R2/R4 still limit which groups they can assign. | 2026-10-22 | [RBAC](03-rbac.md) |
| Q26 | Seed grant matrix choices | **Confirmed:** Managers can approve registrations; employees can see their own salary (`employee.view_compensation@OWN`); the Viewer group stays read-only at OWN. Auditors are set up by granting `audit.view` to a group. | 2026-10-22 | [RBAC §2a](03-rbac.md#2a-seed-grant-matrix) |

## Deferred to go-live

| # | Question | Current plan | Needed by |
|---|---|---|---|
| Q18 | **Production domain** name, and who manages its DNS? | **Not decided. Deliberately left to go-live.** Staging uses a subdomain (`staging-console.<domain>`) on a domain we control now (e.g. Hostinger-managed), with an ACM certificate on the ALB. At go-live, add the same two CNAME records (certificate validation + `console` → prod ALB) at whoever runs the production domain's DNS ([ADR 0012](adr/0012-dns-at-registrar-alb-https.md)). | Production go-live |

## Still open

| # | Question | Recommended default | Needed by |
|---|---|---|---|
| Q11 | **Managed Services** SLA tiers, ticket categories, escalation, client portal details? | Defined in the Phase 3 discovery workshop. Out of scope until then. | 3 |
| — | Phase 2b module details (approval levels, retention, etc.) | Listed under "Open questions" in each stub spec | Each 2b milestone |
