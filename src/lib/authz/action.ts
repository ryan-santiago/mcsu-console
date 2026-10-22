import "server-only";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { recordAudit, requestMeta, type AuditEntry } from "@/lib/audit";
import { createNotifier, type NotifyFn, type ResolveFn } from "@/server/notifications/notify";
import type { Prisma } from "@/generated/prisma/client";
import type { PermissionKey } from "./catalog";
import { ConflictError, NotFoundError, PolicyError } from "./errors";
import { can, needsTwoFactorSetup } from "./policy";
import { membershipAllows, type OneLotRole } from "./resource";
import { getCurrentUser } from "./session";
import type { AuthUser } from "./types";

/**
 * authedAction: the ONLY way to write (docs/07-conventions.md, AGENTS.md §1–4).
 * 1. active user (2FA done) → 2. permission (or One-Lot membership) → 3. Zod → 4. handler in a
 * transaction with audit()/notify() → 5. after commit: revalidate + send emails → ActionResult.
 * Expected failures are thrown as typed errors inside the handler and mapped here.
 */

export type ActionError =
  "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "CONFLICT" | "UNKNOWN";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError; message?: string; fieldErrors?: Record<string, string[]> };

export type AuditFn = (entry: AuditEntry) => Promise<void>;

export type ActionContext<I> = {
  user: AuthUser;
  input: I;
  tx: Prisma.TransactionClient;
  audit: AuditFn;
  notify: NotifyFn;
  resolve: ResolveFn;
};

export type ActionOptions<S extends z.ZodType, R> = {
  /** All listed permissions are required (at any scope); handlers then apply scopeWhere. */
  permission: PermissionKey | readonly PermissionKey[];
  schema: S;
  /** One-Lot membership may stand in for the permission (03 §5b, ADR 0013). */
  resource?: { type: "onelot"; id: (input: z.infer<S>) => string };
  /** Paths to revalidate after a successful commit. */
  revalidate?: (data: R) => string[];
};

function fieldErrorsOf(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_form";
    (out[path] ??= []).push(issue.message);
  }
  return out;
}

async function oneLotRole(userId: string, oneLotProjectId: string): Promise<OneLotRole | null> {
  const member = await prisma.oneLotMember.findUnique({
    where: { oneLotProjectId_userId: { oneLotProjectId, userId } },
    select: { role: true },
  });
  return member?.role ?? null;
}

export function authedAction<S extends z.ZodType, R>(
  opts: ActionOptions<S, R>,
  handler: (ctx: ActionContext<z.infer<S>>) => Promise<R>,
): (input: z.input<S>) => Promise<ActionResult<R>> {
  const permissions = [opts.permission].flat() as PermissionKey[];

  return async (rawInput) => {
    const user = await getCurrentUser();
    if (!user || user.status !== "ACTIVE") return { ok: false, error: "UNAUTHENTICATED" };
    if (needsTwoFactorSetup(user)) {
      return { ok: false, error: "FORBIDDEN", message: "Set up two-factor authentication first." };
    }

    const parsed = opts.schema.safeParse(rawInput);
    if (!parsed.success) {
      return { ok: false, error: "VALIDATION", fieldErrors: fieldErrorsOf(parsed.error) };
    }
    const input = parsed.data as z.infer<S>;

    let allowed = permissions.every((key) => can(user, key));
    if (!allowed && opts.resource) {
      const role = await oneLotRole(user.id, opts.resource.id(input));
      allowed = permissions.every((key) => can(user, key) || membershipAllows(role, key));
    }
    if (!allowed) return { ok: false, error: "FORBIDDEN" };

    const meta = requestMeta(await headers());
    const actor = { id: user.id, email: user.email, ip: meta.ip, userAgent: meta.userAgent };
    let flush: () => Promise<void> = async () => {};

    try {
      const data = await prisma.$transaction(async (tx) => {
        const notifier = createNotifier(tx, user.id);
        flush = notifier.flush;
        return handler({
          user,
          input,
          tx,
          audit: (entry) => recordAudit(tx, actor, entry),
          notify: notifier.notify,
          resolve: notifier.resolve,
        });
      });
      for (const path of opts.revalidate?.(data) ?? []) revalidatePath(path);
      await flush();
      return { ok: true, data };
    } catch (error) {
      if (error instanceof NotFoundError)
        return { ok: false, error: "NOT_FOUND", message: error.message };
      if (error instanceof PolicyError)
        return { ok: false, error: "FORBIDDEN", message: error.message };
      if (error instanceof ConflictError)
        return { ok: false, error: "CONFLICT", message: error.message };
      console.error("[action] unexpected error", error); // Sentry hooks in here once configured
      return { ok: false, error: "UNKNOWN", message: "Something went wrong. Please try again." };
    }
  };
}
