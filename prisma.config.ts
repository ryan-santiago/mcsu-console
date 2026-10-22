import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 doesn't load .env files. Locally, read .env.local; in Docker/AWS the env is injected.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations run as the `migrator` user on RDS (docs/11-aws-deployment.md §5.2).
  // `prisma generate` doesn't need a URL, so a missing one is fine at build time.
  datasource: {
    url: process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL,
  },
});
