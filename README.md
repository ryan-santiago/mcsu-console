# MCSU Console

The department's internal operations console for **QSERV – MCSU**. It replaces `mcsu-app` with a cleaner, safer foundation.

| Business line | What the console handles |
|---|---|
| **Staff Augmentation** | Employees deployed to clients: contracts, renewals, deployments, Monthly Activity Reports (MAR) |
| **One-Lot Projects** | Projects our team builds or implements end-to-end, run like JIRA: backlog, sprints, kanban, calendar, documents |
| **Managed Services** | Ticketing and SLA tracking (Phase 3) |

Every employee can sign in, from a desktop or **installed on their phone (PWA)**. What each person sees depends on their **Group** (rank + permissions) and the **scope** of each permission (`ALL` / `TEAM` / `OWN`).

## Stack

Next.js 16 (App Router) · TypeScript (strict) · pnpm · Better Auth · Prisma 7 · PostgreSQL 17 (AWS RDS) · Tailwind CSS v4 · shadcn/ui · Zod 4 · TanStack Table/Query · Vitest · Playwright · Docker

## Quick start

```bash
pnpm install
cp .env.example .env.local        # fill DATABASE_URL, BETTER_AUTH_SECRET, …
pnpm db:migrate                   # prisma migrate dev
pnpm db:seed                      # permission catalog sync, groups, lookups, Super Admin
pnpm dev                          # http://localhost:3000
```

Or with Docker (local Postgres, no cloud account needed):

```bash
cp .env.docker.example .env.docker
docker compose --profile prod up -d --build   # Postgres + migrate/seed + app → http://localhost:3000
```

See [docs/10-docker.md](docs/10-docker.md) for dev and hot-reload options.

Full setup is in [docs/02-tech-stack-and-setup.md](docs/02-tech-stack-and-setup.md).

## Documentation

| # | Doc | What it covers |
|---|---|---|
| 00 | [Vision](docs/00-vision.md) | Purpose, business lines, personas, scope |
| 01 | [Architecture](docs/01-architecture.md) | Folder layout, request flow, layers |
| 02 | [Tech stack & setup](docs/02-tech-stack-and-setup.md) | Versions, scripts, environments, env vars |
| 03 | [RBAC](docs/03-rbac.md) | Groups, rank, permission catalog, scopes, policy rules |
| 04 | [Data model](docs/04-data-model.md) | Entities, ERD, draft Prisma schema ([schema.draft.prisma](docs/reference/schema.draft.prisma)) |
| 05 | [Design system](docs/05-design-system.md) | Brand, tokens, palettes, light/dark, layout, dashboards |
| 06 | [Roadmap](docs/06-roadmap.md) | Phases, milestones, definition of done |
| 07 | [Conventions](docs/07-conventions.md) | Code, server actions, validation, audit, testing, git |
| 08 | [Open questions](docs/08-open-questions.md) | Decisions still needed, each with a recommended default |
| 09 | [Mobile & PWA](docs/09-mobile-and-pwa.md) | Responsive patterns, bottom-tab shell, installable PWA, offline drafts, push |
| 10 | [Docker](docs/10-docker.md) | Dockerfile, compose profiles, local development in containers |
| 11 | [AWS deployment](docs/11-aws-deployment.md) | Architecture, DNS & HTTPS, deployment method, secrets, cron, monitoring. Visual version: [architecture/mcsu-console-aws.html](docs/architecture/mcsu-console-aws.html) |
| — | [ADRs](docs/adr/) | Architecture decision records |
| — | [Modules](docs/modules/) | One spec per module |

AI agents and new developers should read [AGENTS.md](AGENTS.md) first.
