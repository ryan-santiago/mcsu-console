import "server-only";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { PermissionKey } from "./catalog";
import { can, needsTwoFactorSetup } from "./policy";
import type { AuthUser } from "./types";
import { AUTH_USER_INCLUDE, toAuthUser } from "./user";

/** Header set by src/proxy.ts so server code can build `?next=` redirects. */
export const PATHNAME_HEADER = "x-mcsu-pathname";

/**
 * The signed-in user, loaded from the DB once per request (React cache(), never across requests;
 * ADR 0006 / 0015). Returns null without a valid session. Any status is returned; callers decide.
 * Must be called inside a <Suspense> boundary (it reads request headers).
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;
  const row = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: AUTH_USER_INCLUDE,
  });
  return row ? toAuthUser(row) : null;
});

async function loginRedirect(): Promise<never> {
  const path = (await headers()).get(PATHNAME_HEADER);
  redirect(path && path !== "/" ? `/login?next=${encodeURIComponent(path)}` : "/login");
}

/**
 * An ACTIVE user who has completed required 2FA. Otherwise redirects:
 * no session → /login, PENDING → /pending, rank ≤ 10 employee-linked user without TOTP → 2FA setup (R15).
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user || user.status === "SUSPENDED") return loginRedirect();
  if (user.status === "PENDING") redirect("/pending");
  if (needsTwoFactorSetup(user)) redirect("/settings/security/2fa-setup");
  return user;
}

/** requireUser() + the permission at any scope, else the 403 page. */
export async function requirePermission(key: PermissionKey): Promise<AuthUser> {
  const user = await requireUser();
  if (!can(user, key)) forbidden();
  return user;
}
