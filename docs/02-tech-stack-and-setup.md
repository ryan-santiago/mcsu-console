# 02 · Tech stack & setup

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Runtime | Node.js 22 LTS | `.nvmrc` + `engines` |
| Package manager | **pnpm 10** (`pnpm@10.34.7`) | Pinned by the `packageManager` field (Corepack). `pnpm-lock.yaml` committed. Build scripts allowed only for the packages in `pnpm-workspace.yaml` |
| Framework | **Next.js 16.4** (App Router, RSC, Server Actions, Turbopack, **Cache Components + Partial Prefetching**) | Read `node_modules/next/dist/docs/` for API changes. Caching rules: [ADR 0015](adr/0015-cache-components.md) |
| Language | **TypeScript 5.9**, `strict`, `noUncheckedIndexedAccess` | Stay on 5.x for now: TypeScript 7 (native compiler) is out, but move only once Next, typescript-eslint and Prisma support it |
| Auth | **Better Auth 1.7** (email + password; `prismaAdapter`; plugins `twoFactor` (TOTP, employee-linked users only; mandatory at rank ≤ 10), `haveIBeenPwned`; allowed-domain hook) | Self-register → pending → approval. No SSO: email + password (+ TOTP) only (Q14) |
| ORM | **Prisma 7.10.x** with `@prisma/adapter-pg` (one driver for local Docker, CI and RDS) | `prisma-client` generator outputs to `src/generated/prisma`. **Pin `prisma@^7.10` / `@prisma/client@^7.10`.** As of Oct 2026, npm's `latest` tag points to `8.0.0-rc.*`, whose CLI has changed (no `validate` command), so don't install untagged. The draft schema is validated with 7.10.1 |
| Database | **PostgreSQL 17**: AWS RDS (staging/prod), Docker container (local/CI) | [11-aws-deployment.md](11-aws-deployment.md) |
| UI | **Tailwind CSS v4** (via the `@tailwindcss/turbopack` loader, no PostCSS config) + **shadcn/ui** (Radix base, `nova` style; class merging via shadcn's `cn` package) + lucide-react | Tokens in `globals.css` (`@theme inline`), contrast-tested in `tests/unit/design-tokens.test.ts` |
| Theme | `next-themes` (light/dark/system) + `data-palette` attribute | See [05-design-system.md](05-design-system.md) |
| Forms | react-hook-form + `@hookform/resolvers` + **Zod 4** | Same schema on client and server |
| Tables | TanStack Table v8 + shadcn Data Table | Server-side paging/sort/filter |
| Client data | TanStack Query v5 (only where needed: boards, infinite lists) | RSC is the default |
| URL state | `nuqs` | Filters, page, sort, tabs |
| Charts | shadcn Charts (Recharts) | |
| Drag & drop | `@dnd-kit` | Kanban, backlog ordering (touch sensors + long-press) |
| Mobile UI | `vaul` (via shadcn Drawer) | Bottom drawers on phones |
| PWA | Next built-in `app/manifest.ts` + hand-written `public/sw.js`; `idb-keyval` (offline drafts); `web-push` (VAPID) | See [09-mobile-and-pwa.md](09-mobile-and-pwa.md). Serwist only if caching needs grow |
| Rich text | Tiptap 3 | Work item descriptions, comments |
| PDF | `@react-pdf/renderer` (server) | Monthly Activity Report. Replaces html2canvas + jsPDF |
| Import | `exceljs` (.xlsx read + template generation), `papaparse` (.csv) | [Data Import](modules/data-import.md) |
| Email | Microsoft Graph (`sendMail`) via an `EmailService` interface | Console driver in dev |
| Env validation | `@t3-oss/env-nextjs` + Zod | Build fails on missing vars |
| Dates | `date-fns` + `@date-fns/tz` (Asia/Manila) | |
| Testing | **Vitest 4** (unit), **Playwright** (e2e: desktop Chrome, Pixel 7, iPhone 14) | |
| Lint/format | ESLint 9 flat (`eslint-config-next`) + project rules ([07 § Lint rules](07-conventions.md#lint-rules-custom-set-up-in-milestone-11)), Prettier + `prettier-plugin-tailwindcss` | Stay on ESLint 9 until `eslint-config-next` supports 10 |
| Git hooks | `lefthook` (format, lint-staged, commitlint) | |
| CI | GitHub Actions: install → typecheck → lint → test → build; Playwright against staging after deploy | |
| Hosting | **AWS `ap-southeast-1` (Singapore): EC2 + ALB + RDS**, Terraform | [ADR 0011](adr/0011-aws-ec2-rds.md), [11-aws-deployment.md](11-aws-deployment.md) |
| Containers | Docker multi-stage (`output: "standalone"`), Compose with Postgres 17 | [10-docker.md](10-docker.md), [ADR 0010](adr/0010-docker-support.md) |
| Observability | CloudWatch (logs, metrics, alarms), Sentry (errors), `pino` structured logs | |

## Prerequisites
- Node 22, `corepack enable` (provides pnpm)
- Docker Desktop (WSL 2): local Postgres, and optionally the whole app
- For deploys: AWS account access (IAM Identity Center), AWS CLI + Session Manager plugin, Terraform
- Optional: an Azure app registration for Graph email and SharePoint (Phase 2)

## Scaffolding (done in milestone 1.1)
The project was created with `create-next-app@16.4.2` (TypeScript, Tailwind, ESLint, App Router, `src/`, Turbopack), then `shadcn@4.22.1 init -t next -b radix -p nova`. To set up a fresh clone:

```bash
corepack enable                      # uses pnpm@10.34.7 from package.json
pnpm install                         # also runs prisma generate (postinstall)
cp .env.example .env.local           # fill BETTER_AUTH_SECRET
docker compose up -d db              # Postgres 17
pnpm db:migrate && pnpm db:seed      # schema + lookups/holidays (skip-if-exists)
pnpm dev                             # http://localhost:3000 · /design for the token reference
```

Add shadcn components with `pnpm dlx shadcn@latest add <name>` (the registry is occasionally slow, so retry on timeout).

## Environment variables
`.env.example` (committed; created in milestone 1.1). Every variable must also be declared in `src/lib/env.ts`.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres URL (app user). On RDS add `sslmode=verify-full` + the RDS CA bundle |
| `MIGRATE_DATABASE_URL` | migrate job | Postgres URL for the `migrator` (DDL) user, used by `prisma migrate deploy` |
| `APP_ENV` | ✅ | `local` \| `staging` \| `prod`. Guards environment-specific behaviour (e.g. the seed refuses demo data in `prod`, `/design` is hidden in `prod`) |
| `BETTER_AUTH_SECRET` | ✅ | 32+ random bytes |
| `BETTER_AUTH_URL` | ✅ | e.g. `http://localhost:3000` |
| `APP_URL` | ✅ | Public base URL, read at **runtime** (absolute links in emails, PWA). There are no `NEXT_PUBLIC_*` variables, so the same image runs in every environment ([ADR 0014](adr/0014-build-once-runtime-config.md)) |
| `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_NAME` / `SEED_SUPERADMIN_PASSWORD` | seed only | First Super Admin: the `mcsu_automations@questronix.com.ph` service account (no employee data, so no 2FA). Use a long unique password per environment |
| `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` | Phase 2 | Graph email / SharePoint |
| `MAIL_SENDER` / `MAIL_REPLY_TO` / `MAIL_OVERRIDE_TO` | Phase 1.3 (password reset) | One shared sender mailbox via Graph (ADR 0009). Reply-to address. Dev redirect of all mail. Without Azure vars, the console driver logs emails instead |
| `STORAGE_DRIVER` | Phase 2.1 | `local` \| `sharepoint` ([ADR 0007](adr/0007-sharepoint-document-storage.md)) |
| `SHAREPOINT_SITE_ID` / `SHAREPOINT_DRIVE_NAME` | Phase 2.1 (`sharepoint` driver) | Target site and document library |
| `CRON_SECRET` | Phase 2 | Shared secret header sent by EventBridge to `/api/cron/*` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Phase 2.6 | Web Push. The public key reaches the browser through server-rendered props, not a build-time variable |
| `SENTRY_DSN` | optional | Error reporting |

## Scripts (`package.json`)

| Script | Command |
|---|---|
| `dev` | `next dev` |
| `build` / `start` | `next build` / `next start` |
| `typecheck` | `tsc --noEmit` |
| `lint` / `format` | `eslint .` / `prettier --write .` |
| `test` / `test:e2e` | `vitest run --coverage` / `playwright test` |
| `check` | `pnpm typecheck && pnpm lint && pnpm test` |
| `db:generate` | `prisma generate` |
| `db:migrate` | `prisma migrate dev` |
| `db:deploy` | `prisma migrate deploy` (CI/prod) |
| `db:seed` | `tsx prisma/seed.ts` (idempotent) |
| `db:studio` | `prisma studio` |

## Environments

| Env | Database | Deploy | Seed |
|---|---|---|---|
| Local | Docker `db` (Postgres 17) | `pnpm dev` or `docker compose --profile dev up` | full seed + demo data (`SEED_DEMO=1`) |
| CI | Postgres 17 service container | GitHub Actions (tests only) | per test run |
| Staging | RDS (staging database) | automatic on merge to `main` (ECR → SSM deploy) | catalog + groups + lookups + demo data |
| Production | RDS (prod) | release tag + manual approval | catalog sync on every deploy (`migrate` job) |

There is **one seed script** for every environment. It creates only what's missing and skips existing records ([04 § Seed data](04-data-model.md#seed-data-fresh-start)). It always runs the **permission catalog sync** (see [03-rbac.md](03-rbac.md#catalog-sync)). Deploying a removed permission therefore also cleans it out of every group.
