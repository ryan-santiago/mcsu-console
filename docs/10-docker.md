# 10 · Docker

MCSU Console runs in containers everywhere: **local development, CI, and staging/production on AWS EC2** ([11-aws-deployment.md](11-aws-deployment.md), [ADR 0011](adr/0011-aws-ec2-rds.md)). The `runner` image built here is exactly what's deployed ([ADR 0010](adr/0010-docker-support.md)).

## Files

| File | Purpose |
|---|---|
| [`Dockerfile`](../Dockerfile) | Multi-stage: `deps` → `dev` / `build` → `migrate` / `runner` |
| [`compose.yaml`](../compose.yaml) | `db` (Postgres 17) always; profiles `dev`, `tools`, `prod` |
| [`.dockerignore`](../.dockerignore) | Keeps the build context small, and keeps secrets and `.next` out |
| [`.env.docker.example`](../.env.docker.example) | Copy to `.env.docker` (git-ignored) |

## Everyday commands

```bash
cp .env.docker.example .env.docker            # once; fill BETTER_AUTH_SECRET etc.

# A) Postgres only. Run the app on the host (fastest hot reload on Windows)
docker compose up -d db
#    then in .env.local: DATABASE_URL=postgresql://mcsu:mcsu@localhost:5432/mcsu_console
pnpm db:migrate && pnpm db:seed && pnpm dev

# B) Everything in containers, with hot reload
docker compose --profile dev up --build
docker compose --profile tools run --rm migrate   # first time / after new migrations

# C) Production image locally (what you'd ship to a container host)
docker compose --profile prod up -d --build      # migrate runs first, then app
docker compose logs -f app

# Housekeeping
docker compose down            # stop
docker compose down -v         # stop and DELETE the local database volume
```

Open http://localhost:3000 and sign in with `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD`.

## How the image is built

| Stage | What it does |
|---|---|
| `deps` | `pnpm install --frozen-lockfile`, cached on `pnpm-lock.yaml` (BuildKit cache mount) |
| `dev` | Full source + `prisma generate`, runs `pnpm dev` on `0.0.0.0:3000` |
| `build` | `prisma generate` + `next build` with `output: "standalone"`. **No environment-specific build args:** public config is read at runtime, so the same image is promoted from staging to prod ([ADR 0014](adr/0014-build-once-runtime-config.md)) |
| `migrate` | Inherits `build` (has the Prisma CLI and tsx), runs `prisma migrate deploy && seed`. A one-off job, **never** run on app start |
| `runner` | `node:22-alpine`, non-root `nextjs` user, only `.next/standalone` + static + `public`, `HEALTHCHECK` on `/api/health` |

**App requirements** (implemented in Phase 1.1):
- `next.config.ts`: `output: "standalone"`.
- `src/app/api/health/route.ts`: **liveness**. Returns `200 {status:"ok"}` without touching the database, so a short DB blip doesn't mark the only instance unhealthy. Used by the Docker `HEALTHCHECK` and the ALB target group.
- `src/app/api/ready/route.ts`: **readiness**. Returns `200` after a `SELECT 1`, `503` otherwise. Used by `deploy.sh` to decide whether to keep or roll back a release. Both routes are unauthenticated and return no data.
- `src/lib/env.ts`: honours `SKIP_ENV_VALIDATION=1` (build stage only). Runtime still validates.
- `.gitignore` includes `.env.docker`.

## Database driver
The app uses **one driver everywhere**: `@prisma/adapter-pg` (node-postgres), for local Docker, CI and RDS.

```ts
// src/lib/db.ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL, max: 10 });
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
```

| Where | `DATABASE_URL` |
|---|---|
| Docker / local | `postgresql://mcsu:mcsu@db:5432/mcsu_console` (`localhost` when the app runs on the host) |
| CI | GitHub Actions `postgres:17` service container |
| AWS (staging/prod) | RDS endpoint with `sslmode=verify-full` + RDS CA bundle (from SSM Parameter Store) |

## Windows notes
- Bind-mounted hot reload uses polling (`WATCHPACK_POLLING=true`), which is slower than native. Option **A** (DB in Docker, app on host) is the smoothest day-to-day.
- Keep the repo on a local drive. Line endings: `.gitattributes` with `* text=auto eol=lf` so shell scripts work in Linux containers.
- Docker Desktop must be running (WSL 2 backend).

## Deploying the container
Staging and production run this image on AWS EC2 via ECR and an SSM deploy script. See [11-aws-deployment.md §5](11-aws-deployment.md#5-deployment-method). Images are built for **arm64** (Graviton) with `docker buildx`. Local development on x86 still works with a native build.

## CI
The GitHub Actions job `docker` builds the `runner` target on every PR (no push) to catch Dockerfile drift. On merge to `main` it pushes `mcsu-console:<sha>` (runner) and `mcsu-console:<sha>-migrate` to **ECR** and deploys to staging. Release tags copy those same images to the prod ECR by digest and deploy them after approval. Production never rebuilds ([ADR 0014](adr/0014-build-once-runtime-config.md)).
