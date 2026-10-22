import { connection } from "next/server";
import { prisma } from "@/lib/db";

// Readiness: can we serve requests (DB reachable)? Used by deploy/deploy.sh to keep or roll back a release.
export async function GET() {
  await connection();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
