# 0001 · Prisma 7 instead of Drizzle

**Status:** Accepted · 2026-10-21 · *Driver amended by [0011](0011-aws-ec2-rds.md): `@prisma/adapter-pg` on AWS RDS instead of the Neon adapter.*

## Context
mcsu-app used Drizzle, with 68 migrations and a 2,180-line single schema file. The rebuild starts fresh, and the team asked for Prisma.

## Decision
Use **Prisma 7** (`prisma-client` generator, `@prisma/adapter-neon` driver adapter, `prisma.config.ts`) with Neon Postgres. Raw SQL is only for things Prisma can't express (partial unique indexes, `citext`), placed inside migrations.

## Consequences
- ➕ Readable schema, generated types, mature migrations, Prisma Studio, and Better Auth has a first-class `prismaAdapter`.
- ➕ Prisma 7's TS query engine removes the Rust binary, which suits serverless and Vercel.
- ➖ Complex aggregates (dashboards) may need `$queryRawTyped` (TypedSQL). Keep them in `queries.ts`.
- ➖ Drizzle code in mcsu-app is ported as **logic reference** only, not copied.
