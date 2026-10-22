# 06 · Roadmap

Each milestone ships to production behind real auth. A module is "done" only when it meets the **Definition of Done** below.

## Phase 0: Docs & decisions *(current)*
- [x] Docs set, ADRs, draft schema
- [x] Answer [open questions](08-open-questions.md) (all answered 2026-10-22 except Q11, Phase 3, and Q18, go-live)
- [ ] GitHub repo created; AWS account access (IAM Identity Center) for the team; AWS member account(s) created in the QNX Org (Q19)

## Phase 1: Foundation + Workforce core

Delivered in three releases, each one usable and testable on its own (agreed 2026-10-22):
- **Release 1A, Platform core:** 1.2, 1.3, 1.4, 1.5, 1.5b ✅ (branch `feat/release-1a`)
- **Release 1B, Administration:** 1.6, 1.7, 1.8, 1.9, 1.2b
- **Release 1C, Workforce:** 1.10, 1.11, 1.12, then production go-live
- **1.1b AWS** runs in parallel as soon as the AWS accounts exist (needed before go-live, ideally by 1B).

| # | Milestone | Scope | Module docs |
|---|---|---|---|
| 1.1 ✅ | **Scaffold** (done 2026-10-22, branch `feat/scaffold`) | Next 16 + pnpm + TS strict, Tailwind v4 + shadcn, Prettier/ESLint/lefthook, Vitest/Playwright, CI, env validation, Prisma 7 + pg adapter, **Docker (standalone output, `/api/health`, compose verified)**, `/design` page | [02](02-tech-stack-and-setup.md), [05](05-design-system.md), [10](10-docker.md) |
| 1.1b | **AWS infrastructure** | Terraform: VPC, ALB + ACM certificate (validation + CNAME records added at the DNS provider, e.g. Hostinger), EC2 (staging), RDS, ECR, SSM, CloudWatch alarms, GitHub OIDC; `deploy/compose.aws.yaml` + `deploy.sh`; CD to staging on merge | [11](11-aws-deployment.md) |
| 1.2 ✅ | **Shell & theme** | Sidebar, top bar, **mobile top bar + bottom tabs**, command palette, light/dark + 4 palettes, logo, error/404/403 pages, `ResponsiveTable`/`ResponsiveDialog` primitives | [05](05-design-system.md), [09](09-mobile-and-pwa.md) |
| 1.2b | **PWA baseline** | Manifest, icons and splash, theme-color, service worker (static cache + offline page), update toast, install prompt, cache clear on sign-out | [09](09-mobile-and-pwa.md) |
| 1.3 ✅ | **Auth** | Better Auth email+password, allowed-domain check, register → pending, login gate, forgot/reset password, session revocation, **TOTP 2FA (mandatory for rank ≤ 10, R15) + backup codes**, breached-password check | [users](modules/users.md), [Q7](08-open-questions.md) |
| 1.4 ✅ | **AuthZ core** | catalog, `getCurrentUser`, `can`, `scopeWhere`, `membershipAllows`/`oneLotWhere`, policy rules R1–R15, `authedAction`/`authedQuery`, custom lint rules, 100% tests | [03](03-rbac.md) |
| 1.5 ✅ | **Audit Trail** | `recordAudit`, `diffFields`, audit page with filters | [audit-trail](modules/audit-trail.md) |
| 1.5b ✅ | **Notifications core** | `Notification` model, event catalog, `notify()` in `authedAction`, top-bar bell, `/inbox` (To do · Notifications), email delivery after commit. Every later milestone registers its events here | [notifications](modules/notifications.md) |
| 1.6 | **Groups & Roles** | list cards, editor with scope selectors, rank rules | [groups-roles](modules/groups-roles.md) |
| 1.7 | **User Management** | pending queue, approve with group, change group, suspend, link employee, employee-aware display | [users](modules/users.md) |
| 1.8 | **Maintenance** | lookups, Teams + Team Leads, Job Profiles, Holidays | [maintenance](modules/maintenance.md) |
| 1.9 | **Settings & Profile** | my profile (employee data), change request, password, appearance | [settings-profile](modules/settings-profile.md) |
| 1.10 | **Employees** | list (scoped), detail, create/edit, addresses (PSGC), employment & deployment history, compensation guard, export | [employees](modules/employees.md) |
| 1.11 | **Projects (S3P)** | list (scoped), detail, contract lines, team assignment, financials guard | [projects](modules/projects.md) |
| 1.12 | **Data import** | CSV/Excel importer for Employees and Projects with downloadable templates, dry-run review, all-or-nothing commit. Used for the pre-go-live data-entry week | [data-import](modules/data-import.md) |

**Production go-live for Phase 1:** provision the prod environment (same Terraform, prod variables), run the restore-from-backup drill once, **decide the production domain and add its DNS records (Q18)**, then deploy the first release tag.

**Exit criteria:** a Team Lead logs in and sees only their team's employees and projects. An Employee sees only themselves. The Admin sees everything. Every rank rule is verified by e2e tests.

## Phase 2: Engagement & Productivity

| # | Milestone | Module docs |
|---|---|---|
| 2.1 | Activity Reports (daily log, **offline drafts**) + Monthly Activity Report finalize → PDF → record client acknowledgment (no internal approval, Q4), **SharePoint `DocumentStorage` driver** (frozen MAR PDFs), MAR reminder cron | [activity-reports](modules/activity-reports.md), [ADR 0007](adr/0007-sharepoint-document-storage.md) |
| 2.2 | Staff Augmentation: deployments view, renewal board, reminders (cron + email), contract documents | [staff-augmentation](modules/staff-augmentation.md) |
| 2.3 | One-Lot: workspace, S3P links, members, backlog, sprints | [one-lot-projects](modules/one-lot-projects.md) |
| 2.4 | One-Lot: kanban, calendar, documents, summary dashboard | [one-lot-projects](modules/one-lot-projects.md) |
| 2.5 | Dashboards: Workforce + Engagement (scope-aware) | [05 §5](05-design-system.md#5-dashboard-patterns-from-the-subly-reference) |
| 2.6 | **Web Push** for notifications (in-app + email already exist from 1.5b), phone Home dashboard | [09](09-mobile-and-pwa.md), [notifications](modules/notifications.md) |

## Phase 2b: People & organization (from mcsu-app, Q12)
Each module starts as a stub spec. Before its milestone starts, confirm the stub against mcsu-app and fill in the template (permissions, screens, acceptance criteria).

| # | Milestone | Module docs |
|---|---|---|
| 2b.1 | Employee Recommendation (salary increase, promotion, regularization) | [employee-recommendation](modules/employee-recommendation.md) |
| 2b.2 | Certifications (with expiry reminders) | [certifications](modules/certifications.md) |
| 2b.3 | Talent Acquisition (requisitions, candidates, pipeline) | [talent-acquisition](modules/talent-acquisition.md) |
| 2b.4 | Device Inventory | [device-inventory](modules/device-inventory.md) |
| 2b.5 | Announcements | [announcements](modules/announcements.md) |

## Phase 3: Managed Services & integrations
> **Kick-off guide:** before Phase 3 starts, run a walkthrough with the department covering how client accounts work end-to-end (invite → client login → raise ticket → email-to-ticket → SLA → staff queues) and confirm SLA tiers, categories and escalation ([ADR 0009](adr/0009-staff-and-client-accounts.md), [managed-services](modules/managed-services.md)). The client portal uses the same PWA, with a client-only shell and bottom tabs (Tickets · New · Notifications · Profile).

- Managed Services ticketing ([spec stub](modules/managed-services.md))
- Reporting exports (Excel), scheduled reports

## Definition of Done (per module)
1. The module doc is updated: permissions, scope behaviour, screens, acceptance criteria ticked.
2. Every query uses `authedQuery` + `scopeWhere`, and every action uses `authedAction` and writes an audit entry. Every event that needs someone's attention is in the notification catalog ([notifications](modules/notifications.md)).
3. Zod schemas are shared client/server, and server-side validation is tested.
4. Unit tests cover the module's policy/scope branches. E2E covers the happy path plus at least one forbidden case per scope.
5. Works in light/dark × 4 palettes and at 1280px, 768px and 360px widths. Phone flows use mobile patterns (card list, drawer, sticky actions), and Playwright passes on the mobile projects.
6. Loading (`loading.tsx` skeletons), empty and error states are implemented.
7. `pnpm check`, `pnpm build` and the Docker build pass in CI, and the change is reviewed on **staging**.
