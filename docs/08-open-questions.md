# 08 · Open questions

Each question has a **recommended default**. If nobody objects before the relevant milestone starts, the default is applied. When one is decided, move it to **Decided**, and if it's architectural, add an ADR.

## Decided

| # | Question | Decision | Date | Affects |
|---|---|---|---|---|
| Q1 | Can an employee belong to more than one team? | **No. One primary team** (`Employee.teamId`). Cross-team work is expressed through project ↔ team links and One-Lot membership. | 2026-10-22 | [Data model](04-data-model.md), [Employees](modules/employees.md) |
| Q5 | Document storage | **SharePoint** via Microsoft Graph (existing M365 tenant), behind a `DocumentStorage` interface. Local disk in dev. | 2026-10-22 | [ADR 0007](adr/0007-sharepoint-document-storage.md), [One-Lot](modules/one-lot-projects.md) |
| Q6 | Hosting | **AWS `ap-southeast-1` (Singapore): EC2 + ALB + RDS PostgreSQL 17** (changed from Vercel + Neon). | 2026-10-22 | [ADR 0011](adr/0011-aws-ec2-rds.md), [AWS deployment](11-aws-deployment.md) |
| Q7 | Password policy and MFA | Min 12 chars plus a breached-password check (Better Auth `haveIBeenPwned` plugin). **TOTP 2FA is mandatory for groups with rank ≤ 10** (Super Admin, Administrator) via the Better Auth `twoFactor` plugin. Others can opt in from Settings → Security. | 2026-10-22 | [Users](modules/users.md), [Settings](modules/settings-profile.md) |
| Q8 / Q16 | Restrict registration to company email domains? Which ones? | **Self-registration (staff) is limited to `@questronix.com.ph`** (`AppSetting auth.allowedEmailDomains`, editable). **Clients don't self-register:** they're **invited** from Managed Services as `CLIENT` users tied to their Client (Phase 3). Email-to-ticket needs no account. | 2026-10-22 | [ADR 0009](adr/0009-staff-and-client-accounts.md), [Users](modules/users.md) |
| Q17 | Data residency outside the Philippines | **Accepted.** Singapore is the closest full AWS region. | 2026-10-22 | [ADR 0011](adr/0011-aws-ec2-rds.md) |
| Q9 | Should Team Leads see salaries? | **Yes, for their own teams.** Team Leads prepare salary-increase recommendations, so the `Team Lead` group gets `employee.view_compensation` at **TEAM** scope (view only). Changing compensation still needs `employee.update`, which Team Lead doesn't hold by default. | 2026-10-22 | [RBAC](03-rbac.md), [Employees](modules/employees.md) |

| Q19 | Which AWS account? | **A new dedicated member account in the existing QNX AWS Organization** (`qnx-mcsu-console-staging` and `qnx-mcsu-console-prod`). It inherits the Org's SCPs and consolidated billing, and access goes through the Org's IAM Identity Center. The QNX AWS Org admin creates the account(s). | 2026-10-22 | [AWS deployment §10](11-aws-deployment.md#10-aws-account--organization) |

## Deferred to go-live

| # | Question | Current plan | Needed by |
|---|---|---|---|
| Q18 | **Production domain** name, and who manages its DNS? | **Not decided. Deliberately left to go-live.** Staging uses a subdomain (`staging-console.<domain>`) on a domain we control now (e.g. Hostinger-managed), with an ACM certificate on the ALB. At go-live, add the same two CNAME records (certificate validation + `console` → prod ALB) at whoever runs the production domain's DNS ([ADR 0012](adr/0012-dns-at-registrar-alb-https.md)). | Production go-live |

## Still open

| # | Question | Recommended default | Needed by |
|---|---|---|---|
| Q2 | Must a **Team Lead be an employee** record? | **Yes.** `TeamLead` references `Employee`. The lead's user account is found through `User.employeeId`. | 1.8 |
| Q3 | If someone is assigned as team lead but their group only has `OWN` scope, what happens? | They still see only their own data, and Maintenance shows a warning: "This person's group doesn't grant TEAM scope." Group and lead stay independent. | 1.8 |
| Q4 | Who approves the **Monthly Activity Report**, and is client sign-off needed? | Anyone with `activity_report.approve` in scope (normally the Team Lead). Client signatory name is a field on the PDF; the client doesn't log in. | 2.1 |
| Q10 | Can a user edit their own employee profile directly? | **No.** They submit a change request, which someone with `employee.update` in scope approves (same as mcsu-app). | 1.9 |
| Q11 | **Managed Services** SLA tiers, ticket categories, client portal? | Defined in the Phase 3 discovery workshop. Out of scope until then. | 3 |
| Q12 | Do we still need **Talent Acquisition, Employee Recommendation, Certifications, Device Inventory, Announcements** from mcsu-app? | Not in v1. Note: **Employee Recommendation** (salary increase, regularization) is where Team Leads would act on the compensation data from Q9, so it's a strong candidate for Phase 2 or 3. | 2 |
| Q13 | Is the old **S3P list** wanted as seed data even with a "fresh start"? | No data migration. An optional CSV importer for Employees and Projects can be added in Phase 2 if manual entry is too slow. | 2 |
| Q14 | Do we need **Microsoft SSO** eventually? | Optional in Phase 3. Better Auth supports it, so it's added as an extra sign-in method still subject to approval. | 3 |
| Q15 | Can someone be both an approver of users **and** a Team Lead with limited scope? | Yes. `user.approve` is global, but R2/R4 still limit which groups they can assign. | 1.7 |
