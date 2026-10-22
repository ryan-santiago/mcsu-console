/**
 * The one seed script for every environment (docs/04-data-model.md#seed-data-fresh-start).
 * Rule: create what's missing, skip what exists. Never update or delete existing rows
 * (the permission catalog sync, added in milestone 1.4, is the only exception).
 *
 * Run: `pnpm db:seed` (also run by the Docker `migrate` job after `prisma migrate deploy`).
 */
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATALOG } from "../src/lib/authz/catalog";
import { SEED_GROUPS, SUPER_ADMIN_GROUP } from "../src/lib/authz/seed-groups";
import { philippineHolidays } from "./seed-data/holidays";
import { LOOKUPS } from "./seed-data/lookups";

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // no local env file: DATABASE_URL must come from the environment
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

function report(step: string, total: number, created: number) {
  console.log(`  ${step.padEnd(18)} created ${created}, skipped ${total - created}`);
}

/**
 * 1. Permission catalog sync: the ONE exception to "skip if exists" (03 §3 Catalog sync).
 * Upserts every catalog entry, deletes keys no longer in code (grants cascade), and forces
 * ALL on grants of non-scopable permissions.
 */
async function syncCatalog() {
  const keys = CATALOG.map((p) => p.key);
  await prisma.$transaction(async (tx) => {
    for (const [i, p] of CATALOG.entries()) {
      const data = { module: p.module, label: p.label, scopable: p.scopable, sortOrder: i };
      await tx.permission.upsert({
        where: { key: p.key },
        create: { key: p.key, ...data },
        update: data,
      });
    }
    const removed = await tx.permission.deleteMany({ where: { key: { notIn: keys } } });
    const globalKeys = CATALOG.filter((p) => !p.scopable).map((p) => p.key);
    await tx.groupPermission.updateMany({
      where: { permissionKey: { in: globalKeys }, scope: { not: "ALL" } },
      data: { scope: "ALL" },
    });
    console.log(`  ${"Permission".padEnd(18)} synced ${keys.length}, removed ${removed.count}`);
  });
}

/** 2. Groups: create missing ones with their grants. Existing groups (and their grants) are skipped. */
async function seedGroups() {
  let created = 0;
  for (const group of SEED_GROUPS) {
    const exists = await prisma.group.findUnique({
      where: { name: group.name },
      select: { id: true },
    });
    if (exists) continue;
    // Only one default group may exist (partial unique index): don't add a second.
    const isDefault =
      group.isDefault === true && (await prisma.group.count({ where: { isDefault: true } })) === 0;
    await prisma.group.create({
      data: {
        name: group.name,
        rank: group.rank,
        description: group.description,
        isSystem: group.isSystem ?? false,
        isDefault,
        audience: "STAFF",
        grants: {
          create: Object.entries(group.grants).map(([permissionKey, scope]) => ({
            permissionKey,
            scope,
          })),
        },
      },
    });
    created++;
  }
  report("Group", SEED_GROUPS.length, created);
}

/** 4. First Super Admin from SEED_SUPERADMIN_*. Skipped if any user has that email. */
async function seedSuperAdmin() {
  const email = process.env.SEED_SUPERADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.SEED_SUPERADMIN_NAME?.trim() || "Super Admin";
  const password = process.env.SEED_SUPERADMIN_PASSWORD;
  if (!email || !password) {
    console.log(`  ${"Super Admin".padEnd(18)} skipped (SEED_SUPERADMIN_EMAIL/PASSWORD not set)`);
    return;
  }
  if (password.length < 12)
    throw new Error("SEED_SUPERADMIN_PASSWORD must be at least 12 characters");

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    report("Super Admin", 1, 0);
    return;
  }
  const group = await prisma.group.findUniqueOrThrow({ where: { name: SUPER_ADMIN_GROUP } });
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      name,
      email,
      emailVerified: true,
      type: "STAFF",
      status: "ACTIVE",
      groupId: group.id,
      approvedAt: new Date(),
      // TOTP is mandatory for rank ≤ 10 (R15): set up on first sign-in.
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  });
  report("Super Admin", 1, 1);
}

/** createMany + skipDuplicates = "insert if the unique key isn't there yet". */
async function seedLookups() {
  const tables = [
    [
      "Gender",
      LOOKUPS.genders,
      (data: { name: string }[]) => prisma.gender.createMany({ data, skipDuplicates: true }),
    ],
    [
      "Employment type",
      LOOKUPS.employmentTypes,
      (data: { name: string }[]) =>
        prisma.employmentType.createMany({ data, skipDuplicates: true }),
    ],
    [
      "Engagement type",
      LOOKUPS.engagementTypes,
      (data: { name: string }[]) =>
        prisma.engagementType.createMany({ data, skipDuplicates: true }),
    ],
    [
      "Position",
      LOOKUPS.positions,
      (data: { name: string }[]) => prisma.position.createMany({ data, skipDuplicates: true }),
    ],
  ] as const;

  for (const [step, names, insert] of tables) {
    const { count } = await insert(names.map((name) => ({ name })));
    report(step, names.length, count);
  }

  const levels = LOOKUPS.levels.map((name, i) => ({ name, sortOrder: (i + 1) * 10 }));
  const { count } = await prisma.level.createMany({ data: levels, skipDuplicates: true });
  report("Level", levels.length, count);
}

async function seedHolidays() {
  const year = new Date().getFullYear();
  const holidays = [...philippineHolidays(year), ...philippineHolidays(year + 1)];
  const { count } = await prisma.holiday.createMany({ data: holidays, skipDuplicates: true });
  report("Holiday", holidays.length, count);
}

async function main() {
  const appEnv = process.env.APP_ENV ?? "local";
  console.log(`Seeding (APP_ENV=${appEnv})`);
  if (process.env.SEED_DEMO === "1" && appEnv === "prod") {
    throw new Error("Refusing to load demo data with APP_ENV=prod");
  }

  await syncCatalog(); // 1. Permission catalog (sync)
  await seedGroups(); // 2. Groups + grant matrix (docs/03-rbac.md §2a)
  await seedLookups(); // 3. Lookups
  await seedHolidays(); //    and holidays
  await seedSuperAdmin(); // 4. First Super Admin
  // 5. Demo data (SEED_DEMO=1): added with the modules that own the data (refused above for prod).
}

main()
  .then(() => console.log("Seed complete"))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
