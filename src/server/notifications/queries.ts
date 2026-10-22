import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/authz/types";

/**
 * Notification reads. Everyone sees only their OWN notifications, so no permission is needed:
 * every query is filtered by recipientId = user.id (docs/modules/notifications.md).
 */

export type NotificationDTO = {
  id: string;
  event: string;
  kind: "ACTION" | "INFO";
  title: string;
  body: string | null;
  link: string | null;
  createdAt: string;
  readAt: string | null;
  resolvedAt: string | null;
};

const SELECT = {
  id: true,
  event: true,
  kind: true,
  title: true,
  body: true,
  link: true,
  createdAt: true,
  readAt: true,
  resolvedAt: true,
} as const;

type Row = { [K in keyof typeof SELECT]: unknown } & {
  id: string;
  event: string;
  kind: "ACTION" | "INFO";
  title: string;
  body: string | null;
  link: string | null;
  createdAt: Date;
  readAt: Date | null;
  resolvedAt: Date | null;
};

function toDTO(row: Row): NotificationDTO {
  return {
    id: row.id,
    event: row.event,
    kind: row.kind,
    title: row.title,
    body: row.body,
    link: row.link,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  };
}

/** Memoized per request: the shell asks for it from several Suspense boundaries. */
export const getNotificationSummary = cache(async (user: AuthUser) => {
  const [unread, openActions, latest] = await Promise.all([
    prisma.notification.count({ where: { recipientId: user.id, readAt: null } }),
    prisma.notification.count({
      where: { recipientId: user.id, kind: "ACTION", resolvedAt: null },
    }),
    prisma.notification.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: SELECT,
    }),
  ]);
  return { unread, openActions, latest: latest.map(toDTO) };
});

export const INBOX_PAGE_SIZE = 25;

/** Inbox tabs: "todo" = open ACTION items; "all" = everything. */
export async function listInbox(user: AuthUser, tab: "todo" | "all", page: number) {
  const where =
    tab === "todo"
      ? { recipientId: user.id, kind: "ACTION" as const, resolvedAt: null }
      : { recipientId: user.id };
  const [total, rows] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * INBOX_PAGE_SIZE,
      take: INBOX_PAGE_SIZE,
      select: SELECT,
    }),
  ]);
  return { total, items: rows.map(toDTO) };
}
