import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import {
  getNotificationEvent,
  wantsEmail,
  type NotificationCategory,
  type NotificationEvent,
} from "@/lib/notifications/catalog";
import { sendEmail } from "@/server/email";
import { notificationEmail } from "@/server/email/templates";

/**
 * notify() + resolve() for authedAction handlers (docs/modules/notifications.md § Business rules).
 * Rows are written in the caller's transaction; emails go out only after the commit (flush()).
 */

type Db = PrismaClient | Prisma.TransactionClient;

export type NotifyInput = {
  event: NotificationEvent;
  /** User ids. Duplicates and the acting user are removed automatically. */
  recipientIds?: readonly string[];
  /** Email-only recipients who may not be users (Sales Rep, Solutions Manager). */
  recipientEmails?: readonly string[];
  title: string;
  body?: string | null;
  /** App-relative link, e.g. /admin/users?tab=pending. Authorization re-applies on open. */
  link?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  /** Makes cron reminders fire once: suffixed with the recipient automatically. */
  dedupeKey?: string | null;
};

export type NotifyFn = (input: NotifyInput) => Promise<void>;
export type ResolveFn = (input: {
  event: NotificationEvent;
  entityType: string;
  entityId: string;
}) => Promise<void>;

export type Notifier = {
  notify: NotifyFn;
  resolve: ResolveFn;
  /** Send emails for everything created; call after the transaction commits. */
  flush: () => Promise<void>;
};

export function createNotifier(db: Db, actorId: string | null): Notifier {
  const created: string[] = [];

  const notify: NotifyFn = async (input) => {
    const def = getNotificationEvent(input.event);
    const userIds = [...new Set(input.recipientIds ?? [])].filter((id) => id !== actorId);
    const rows: Prisma.NotificationCreateManyInput[] = [
      ...userIds.map((recipientId) => ({ recipientId, recipientEmail: null, key: recipientId })),
      ...[...new Set(input.recipientEmails ?? [])].map((email) => ({
        recipientId: null,
        recipientEmail: email.toLowerCase(),
        key: email.toLowerCase(),
      })),
    ].map(({ recipientId, recipientEmail, key }) => ({
      id: crypto.randomUUID(),
      recipientId,
      recipientEmail,
      event: input.event,
      kind: def.kind,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      dedupeKey: input.dedupeKey ? `${input.dedupeKey}:${key}` : null,
    }));
    if (rows.length === 0) return;
    await db.notification.createMany({ data: rows, skipDuplicates: true });
    created.push(...rows.map((r) => r.id as string));
  };

  const resolve: ResolveFn = async ({ event, entityType, entityId }) => {
    await db.notification.updateMany({
      where: { event, entityType, entityId, resolvedAt: null },
      data: { resolvedAt: new Date() },
    });
  };

  const flush = async () => {
    if (created.length === 0) return;
    const ids = created.splice(0);
    try {
      await sendNotificationEmails(ids);
    } catch (error) {
      console.error("[notifications] email dispatch failed", error); // in-app rows still exist
    }
  };

  return { notify, resolve, flush };
}

type Preferences = { notifications?: { email?: Partial<Record<NotificationCategory, boolean>> } };

async function sendNotificationEmails(ids: string[]): Promise<void> {
  const rows = await prisma.notification.findMany({
    where: { id: { in: ids }, emailedAt: null },
    include: { recipient: { select: { email: true, preferences: true, status: true } } },
  });
  for (const row of rows) {
    const def = getNotificationEvent(row.event as NotificationEvent);
    const prefs = (row.recipient?.preferences ?? {}) as Preferences;
    const to = row.recipient?.email ?? row.recipientEmail;
    if (!to) continue;
    if (row.recipient && row.recipient.status === "SUSPENDED" && !def.alwaysEmail) continue;
    if (row.recipient && !wantsEmail(def, prefs.notifications)) continue;
    const url = row.link ? new URL(row.link, env.APP_URL).toString() : null;
    await sendEmail(notificationEmail(to, row.title, row.body, url));
    await prisma.notification.update({ where: { id: row.id }, data: { emailedAt: new Date() } });
  }
}
