import "server-only";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { prisma } from "@/lib/db";
import { recordAudit, requestMeta, type AuditActor } from "@/lib/audit";

/**
 * Better Auth hooks: the employee-only 2FA guard, and auth events → audit trail (docs/07-conventions.md § Audit): login, login_failed, logout,
 * register, password_reset_requested, password_reset, two_factor_enabled/disabled.
 * Audit failures are logged and never block authentication.
 */

const AUDITED_PATHS = new Set([
  "/sign-in/email",
  "/sign-up/email",
  "/sign-out",
  "/request-password-reset",
  "/reset-password",
  "/two-factor/verify-totp",
  "/two-factor/verify-backup-code",
  "/two-factor/enable",
  "/two-factor/disable",
]);

function meta(headers: Headers | undefined) {
  return headers ? requestMeta(headers) : { ip: null, userAgent: null };
}

async function write(actor: AuditActor, action: string, label?: string | null) {
  try {
    await recordAudit(prisma, actor, {
      module: "auth",
      action,
      entityId: actor.id,
      entityLabel: label ?? actor.email,
    });
  } catch (error) {
    console.error("[audit] failed to record auth event", action, error);
  }
}

export const authAuditHooks = {
  before: createAuthMiddleware(async (ctx) => {
    // 2FA is only for users linked to an Employee record (R15, decided 2026-10-22).
    if (ctx.path === "/two-factor/enable") {
      const session = await getSessionFromCtx(ctx).catch(() => null);
      const user = session
        ? await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { employeeId: true },
          })
        : null;
      if (!user?.employeeId) {
        throw new APIError("FORBIDDEN", {
          message: "Two-factor authentication is only available to accounts linked to an employee.",
        });
      }
      return;
    }
    // Capture the user before sign-out clears the session.
    if (ctx.path !== "/sign-out") return;
    const session = await getSessionFromCtx(ctx).catch(() => null);
    if (session) {
      const { ip, userAgent } = meta(ctx.headers);
      await write({ id: session.user.id, email: session.user.email, ip, userAgent }, "logout");
    }
  }),

  after: createAuthMiddleware(async (ctx) => {
    if (!AUDITED_PATHS.has(ctx.path)) return;
    const { ip, userAgent } = meta(ctx.headers);
    const failed = ctx.context.returned instanceof APIError;
    const newSession = ctx.context.newSession;
    const body = (ctx.body ?? {}) as { email?: string };
    const email = typeof body.email === "string" ? body.email.toLowerCase() : null;

    switch (ctx.path) {
      case "/sign-in/email":
        if (failed) await write({ id: null, email, ip, userAgent }, "login_failed", email);
        // With 2FA enabled, the session is created only after /two-factor/verify-*.
        else if (newSession) {
          const { user } = newSession;
          await write({ id: user.id, email: user.email, ip, userAgent }, "login");
        }
        return;
      case "/two-factor/verify-totp":
      case "/two-factor/verify-backup-code":
        if (failed) await write({ id: null, email: null, ip, userAgent }, "two_factor_failed");
        else if (newSession) {
          const { user } = newSession;
          await write({ id: user.id, email: user.email, ip, userAgent }, "login");
        }
        return;
      case "/sign-up/email":
        if (!failed && newSession) {
          const { user } = newSession;
          await write({ id: user.id, email: user.email, ip, userAgent }, "register");
        }
        return;
      case "/request-password-reset":
        // Recorded whether or not the email exists; the response never reveals that.
        await write({ id: null, email, ip, userAgent }, "password_reset_requested", email);
        return;
      case "/reset-password":
        if (!failed) await write({ id: null, email: null, ip, userAgent }, "password_reset");
        return;
      case "/two-factor/enable":
      case "/two-factor/disable": {
        if (failed) return;
        const session = ctx.context.session;
        const action = ctx.path.endsWith("enable") ? "two_factor_enabled" : "two_factor_disabled";
        await write(
          { id: session?.user.id ?? null, email: session?.user.email ?? null, ip, userAgent },
          action,
        );
        return;
      }
    }
  }),
};
