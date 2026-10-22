import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { haveIBeenPwned, twoFactor } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { authAuditHooks } from "@/server/audit/auth-events";
import { sendEmail } from "@/server/email";
import { passwordResetEmail } from "@/server/email/templates";
import { createNotifier } from "@/server/notifications/notify";
import { recipientsFor } from "@/server/notifications/recipients";
import { getSetting, isAllowedDomain } from "@/server/settings";

/**
 * Better Auth (docs/modules/users.md, ADR 0004/0006/0009).
 * - Email + password only (no SSO, Q14). Min 12 chars + breached-password check (Q7).
 * - Self-registration only from allowed domains; new users are PENDING with no group.
 * - SUSPENDED users never get a session. PENDING users do, but only reach /pending.
 * - No cookie cache: authorization is loaded from the DB on every request (ADR 0006).
 */
export const auth = betterAuth({
  appName: "MCSU Console",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(passwordResetEmail(user.email, user.name, url));
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },

  rateLimit: {
    // Local dev and e2e runs sign in repeatedly; staging/prod are limited.
    enabled: env.APP_ENV !== "local",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/two-factor/verify-totp": { window: 60, max: 5 },
      "/two-factor/verify-backup-code": { window: 60, max: 5 },
    },
  },

  advanced: {
    // The ALB sets x-forwarded-for (docs/11-aws-deployment.md §12).
    ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
    // Optional chaining: the Docker build stage runs with no env at all (ADR 0014).
    useSecureCookies: env.APP_URL?.startsWith("https://") ?? false,
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email.trim().toLowerCase();
          const allowed = await getSetting("auth.allowedEmailDomains");
          if (!isAllowedDomain(email, allowed)) {
            throw new APIError("FORBIDDEN", {
              message: `Registration is limited to ${allowed.map((d) => `@${d}`).join(", ")} addresses.`,
            });
          }
          return { data: { ...user, email } };
        },
        after: async (user) => {
          // Auto-link to the Employee with the same work email (ADR 0004), if one exists and is free.
          const employee = await prisma.employee.findFirst({
            where: {
              workEmail: { equals: user.email, mode: "insensitive" },
              deletedAt: null,
              user: null,
            },
            select: { id: true },
          });
          if (employee) {
            await prisma.user.update({ where: { id: user.id }, data: { employeeId: employee.id } });
          }
          // Everyone who can approve gets an ACTION item; it resolves for all once one of
          // them approves or rejects (milestone 1.7). Never blocks registration.
          try {
            const notifier = createNotifier(prisma, null);
            await notifier.notify({
              event: "user.registered",
              recipientIds: await recipientsFor(prisma, "user.approve"),
              title: `New registration: ${user.name}`,
              body: `${user.email} is waiting for approval.`,
              link: "/admin/users?tab=pending",
              entityType: "user",
              entityId: user.id,
            });
            await notifier.flush();
          } catch (error) {
            console.error("[notifications] user.registered failed", error);
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { status: true },
          });
          if (!user || user.status === "SUSPENDED") {
            throw new APIError("FORBIDDEN", {
              message: "This account is suspended. Contact an administrator.",
            });
          }
        },
        after: async (session) => {
          await prisma.user.update({
            where: { id: session.userId },
            data: { lastLoginAt: new Date() },
          });
        },
      },
    },
  },

  hooks: authAuditHooks,

  plugins: [
    twoFactor({
      issuer: "MCSU Console",
      backupCodeOptions: { amount: 10 },
    }),
    haveIBeenPwned({
      customPasswordCompromisedMessage:
        "This password has appeared in a data breach. Please choose a different one.",
    }),
    nextCookies(), // must stay last
  ],
});

export type Auth = typeof auth;
