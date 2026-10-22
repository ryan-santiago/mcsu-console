import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

// One driver everywhere: node-postgres via @prisma/adapter-pg (docs/10-docker.md#database-driver).
function createClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL, max: 10 });
  return new PrismaClient({ adapter });
}

// Reuse one client across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createClient();
if (env.APP_ENV === "local") globalForPrisma.prisma = prisma;
