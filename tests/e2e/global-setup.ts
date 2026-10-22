import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PERSONAS, REGISTRATION_PREFIX } from "../fixtures/personas";

/**
 * Puts the database into a known state before e2e runs (local / CI only, never staging/prod).
 * Only touches e2e personas and e2e registrations; the seeded Super Admin is left alone.
 * - Personas: created if missing; the admin persona's 2FA is removed so enrollment is tested
 * - Users from earlier registration tests: deleted
 */
export default async function globalSetup() {
  if (process.env.E2E_BASE_URL) return; // pointing at a deployed environment: don't touch its DB
  if (existsSync(".env.local") && !process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for e2e setup");
  if (process.env.APP_ENV && process.env.APP_ENV !== "local") {
    throw new Error(`Refusing to reset e2e data with APP_ENV=${process.env.APP_ENV}`);
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const registered = await prisma.user.findMany({
      where: { email: { startsWith: REGISTRATION_PREFIX } },
      select: { id: true },
    });
    const ids = registered.map((u) => u.id);
    await prisma.notification.deleteMany({ where: { entityType: "user", entityId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });

    const gender = await prisma.gender.findFirstOrThrow({ select: { id: true } });

    for (const persona of Object.values(PERSONAS)) {
      let user = await prisma.user.findFirst({ where: { email: persona.email } });
      if (!user) {
        const group = await prisma.group.findUniqueOrThrow({ where: { name: persona.group } });
        const id = randomUUID();
        user = await prisma.user.create({
          data: {
            id,
            name: persona.name,
            email: persona.email,
            emailVerified: true,
            status: "ACTIVE",
            groupId: group.id,
            approvedAt: new Date(),
            accounts: {
              create: {
                id: randomUUID(),
                accountId: id,
                providerId: "credential",
                password: await hashPassword(persona.password),
              },
            },
          },
        });
      }

      if (persona.employee && !user.employeeId) {
        const employee = await prisma.employee.upsert({
          where: { workEmail: persona.email },
          create: {
            firstName: persona.employee.firstName,
            lastName: persona.employee.lastName,
            genderId: gender.id,
            workEmail: persona.email,
            mobileNumber: "09170000000",
          },
          update: {},
        });
        await prisma.user.update({ where: { id: user.id }, data: { employeeId: employee.id } });
      }
    }

    // Fresh 2FA state for the enrollment test.
    const admin = await prisma.user.findFirstOrThrow({ where: { email: PERSONAS.admin.email } });
    await prisma.twoFactor.deleteMany({ where: { userId: admin.id } });
    await prisma.session.deleteMany({ where: { userId: admin.id } });
    await prisma.user.update({ where: { id: admin.id }, data: { twoFactorEnabled: false } });
  } finally {
    await prisma.$disconnect();
  }
}
