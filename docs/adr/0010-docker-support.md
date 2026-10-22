# 0010 · Docker support alongside Vercel

**Status:** Accepted · 2026-10-22 · *Amended by [0011](0011-aws-ec2-rds.md): containers are now the production runtime on EC2, and only the `pg` driver is used.*

## Context
The team wants the project to run in Docker containers. Production hosting is Vercel + Neon (ADR 0008), which doesn't use containers.

## Decision
- Maintain a multi-stage `Dockerfile` (`dev`, `migrate`, `runner`) and `compose.yaml` (Postgres 17 + profiles `dev`/`tools`/`prod`) as first-class parts of the repo.
- Use Next.js `output: "standalone"` for a small, non-root production image with a health check.
- `DATABASE_DRIVER` switches Prisma between `@prisma/adapter-neon` (Vercel/Neon) and `@prisma/adapter-pg` (containers/plain Postgres).
- Migrations run as a separate one-off `migrate` job, never on container start.
- CI builds the image on every PR so it can't silently break.

## Consequences
- ➕ One-command local setup (no Neon account needed for new developers), offline development, reproducible demos.
- ➕ A ready exit path from Vercel (Azure Container Apps / on-prem) without code changes.
- ➖ Two database drivers to keep tested. The integration test suite runs against the Postgres container with `pg`, and e2e runs on Vercel previews with `neon`.
- ➖ Self-hosted deployments must provide HTTPS, cron (replacing Vercel Cron) and log shipping themselves.
