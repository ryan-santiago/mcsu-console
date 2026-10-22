# 02 · Tech stack & setup

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Runtime | Node.js 22 LTS | `.nvmrc` + `engines` |
| Package manager | **pnpm 10** | `packageManager` field; `pnpm-lock.yaml` committed |
| Framework | **Next.js 16** (App Router, RSC, Server Actions, Turbopack) | Read `node_modules/next/dist/docs/` for API changes |
| Language | **TypeScript 5.x**, `strict`, `noUncheckedIndexedAccess` | |
| Auth | **Better Auth** (email + password; `prismaAdapter`; plugins `twoFactor` (TOTP, mandatory for rank ≤ 10), `haveIBeenPwned`; allowed-domain hook) | Self-register → pending → approval. Microsoft Entra SSO can be added later via `socialProviders.microsoft` |
| ORM | **Prisma 7.10.x** with `@prisma/adapter-pg` (one driver for local Docker, CI and RDS) | `prisma-client` generator outputs to `src/generated/prisma`. **Pin `prisma@^7.10` / `@prisma/client@^7.10`.** As of Oct 2026, npm's `latest` tag points to `8.0.0-rc.*`, whose CLI has changed (no `validate` command), so don't install untagged. The draft schema is validated with 7.10.1 |
| Database | **PostgreSQL 17**: AWS RDS (staging/prod), Docker container (local/CI) | [11-aws-deployment.md](11-aws-deployment.md) |
| UI | **Tailwind CSS v4** + **shadcn/ui** + lucide-react | Tokens in `globals.css` (`@theme inline`) |
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
| Email | Microsoft Graph (`sendMail`) via an `EmailService` interface | Console driver in dev |
| Env validation | `@t3-oss/env-nextjs` + Zod | Build fails on missing vars |
| Dates | `date-fns` + `@date-fns/tz` (Asia/Manila) | |
| Testing | **Vitest** (unit), **Playwright** (e2e) | |
| Lint/format | ESLint 9 flat (`eslint-config-next`), Prettier + `prettier-plugin-tailwindcss` | |
| Git hooks | `lefthook` (format, lint-staged, commitlint) | |
| CI | GitHub Actions: install → typecheck → lint → test → build; Playwright on preview | |
| Hosting | **AWS `ap-southeast-1` (Singapore): EC2 + ALB + RDS**, Terraform | [ADR 0011](adr/0011-aws-ec2-rds.md), [11-aws-deployment.md](11-aws-deployment.md) |
| Containers | Docker multi-stage (`output: "standalone"`), Compose with Postgres 17 | [10-docker.md](10-docker.md), [ADR 0010](adr/0010-docker-support.md) |
| Observability | CloudWatch (logs, metrics, alarms), Sentry (errors), `pino` structured logs | |

## Prerequisites
- Node 22, `corepack enable` (provides pnpm)
- Docker Desktop (WSL 2): local Postgres, and optionally the whole app
- For deploys: AWS account access (IAM Identity Center), AWS CLI + Session Manager plugin, Terraform
- Optional: an Azure app registration for Graph email and SharePoint (Phase 2)

## Scaffolding (Phase 1, step 1)
```bash
pnpm create next-app@latest mcsu-console --ts --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*" --use-pnpm
pnpm add better-auth @prisma/client@^7.10 @prisma/adapter-pg zod react-hook-form @hookform/resolvers \
  @tanstack/react-table @tanstack/react-query nuqs next-themes lucide-react date-fns @date-fns/tz sonner server-only @t3-oss/env-nextjs
pnpm add -D prisma@^7.10 tsx vitest @vitest/coverage-v8 @playwright/test prettier prettier-plugin-tailwindcss lefthook
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input label textarea select checkbox switch badge avatar dropdown-menu dialog sheet \
  tabs table tooltip popover command separator skeleton sonner sidebar breadcrumb form chart scroll-area alert-dialog
pnpm prisma init
```

## Environment variables
`.env.example` (committed). Every variable must also be declared in `src/lib/env.ts`.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres URL (app user). On RDS add `sslmode=verify-full` + the RDS CA bundle |
| `MIGRATE_DATABASE_URL` | migrate job | Postgres URL for the `migrator` (DDL) user, used by `prisma migrate deploy` |
| `BETTER_AUTH_SECRET` | ✅ | 32+ random bytes |
| `BETTER_AUTH_URL` | ✅ | e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Absolute links in emails |
| `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_NAME` / `SEED_SUPERADMIN_PASSWORD` | seed only | First Super Admin |
| `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` | Phase 2 | Graph email / SharePoint |
| `MAIL_SENDER` / `MAIL_REPLY_TO` / `MAIL_OVERRIDE_TO` | Phase 1.3 (password reset) | One shared sender mailbox via Graph (ADR 0009). Reply-to address. Dev redirect of all mail. Without Azure vars, the console driver logs emails instead |
| `STORAGE_DRIVER` | Phase 2 | `local` \| `sharepoint` \| `s3` |
| `CRON_SECRET` | Phase 2 | Shared secret header sent by EventBridge to `/api/cron/*` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Phase 2.6 | Web Push |
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

The seed is **idempotent** and always runs the **permission catalog sync** (see [03-rbac.md](03-rbac.md#catalog-sync)). Deploying a removed permission therefore also cleans it out of every group.
