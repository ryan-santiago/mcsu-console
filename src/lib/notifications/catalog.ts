/**
 * Notification event catalog (docs/modules/notifications.md § Event catalog).
 * Every event that needs someone's attention is listed here, the same way permissions are.
 * Modules add their events when they're built; 1A ships the platform + user events.
 */

export type NotificationKind = "ACTION" | "INFO";

/** Email/push preference groups shown in Settings → Notifications. */
export type NotificationCategory =
  "approvals" | "account" | "reminders" | "renewals" | "work" | "tickets";

export type NotificationEventDef = {
  event: string;
  kind: NotificationKind;
  category: NotificationCategory;
  /** Email even if the recipient has no preference saved. ACTION events default to true. */
  emailByDefault: boolean;
  /** Email even before the user can sign in (approval outcomes). Ignores preferences. */
  alwaysEmail?: boolean;
};

export const NOTIFICATION_EVENTS = [
  { event: "user.registered", kind: "ACTION", category: "approvals", emailByDefault: true },
  {
    event: "user.approved",
    kind: "INFO",
    category: "account",
    emailByDefault: true,
    alwaysEmail: true,
  },
  {
    event: "user.rejected",
    kind: "INFO",
    category: "account",
    emailByDefault: true,
    alwaysEmail: true,
  },
  {
    event: "user.group_changed",
    kind: "INFO",
    category: "account",
    emailByDefault: true,
    alwaysEmail: true,
  },
  {
    event: "user.suspended",
    kind: "INFO",
    category: "account",
    emailByDefault: true,
    alwaysEmail: true,
  },
  { event: "team.lead_assigned", kind: "INFO", category: "account", emailByDefault: false },
  {
    event: "employee.change_requested",
    kind: "ACTION",
    category: "approvals",
    emailByDefault: true,
  },
  { event: "employee.change_reviewed", kind: "INFO", category: "account", emailByDefault: true },
] as const satisfies readonly NotificationEventDef[];

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number]["event"];

const BY_EVENT: ReadonlyMap<string, NotificationEventDef> = new Map(
  NOTIFICATION_EVENTS.map((e) => [e.event, e]),
);

export function getNotificationEvent(event: NotificationEvent): NotificationEventDef {
  const def = BY_EVENT.get(event);
  if (!def) throw new Error(`Unknown notification event: ${event}`);
  return def;
}

/** Should this event be emailed, given the recipient's saved preferences? */
export function wantsEmail(
  def: NotificationEventDef,
  preferences: { email?: Partial<Record<NotificationCategory, boolean>> } | undefined,
): boolean {
  if (def.alwaysEmail) return true;
  return preferences?.email?.[def.category] ?? def.emailByDefault;
}
