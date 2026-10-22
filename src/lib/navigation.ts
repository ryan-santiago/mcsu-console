import type { PermissionKey } from "@/lib/authz/catalog";
import { can } from "@/lib/authz/policy";
import type { AuthUser } from "@/lib/authz/types";

/**
 * Sidebar + bottom tabs + command palette, from one list (docs/05 §4, docs/09 §2).
 * Filtered by can() on the server; empty sections are hidden. Items are plain data (icon by
 * name) so they can be passed to client components.
 * Modules add their entries when they're built.
 */

export type NavIcon =
  | "home"
  | "inbox"
  | "users"
  | "briefcase"
  | "handshake"
  | "kanban"
  | "file-text"
  | "monitor"
  | "user-cog"
  | "shield"
  | "wrench"
  | "history"
  | "settings";

export type NavItem = {
  title: string;
  href: string;
  icon: NavIcon;
  /** Required permission (any scope). Omit for items every signed-in user sees. */
  permission?: PermissionKey;
  /** Bottom-tab order on phones (lower first). Omit to show only in "More". */
  mobilePriority?: number;
  /** Extra words the command palette matches on. */
  keywords?: string[];
};

export type NavSection = { title: string; items: NavItem[] };

const NAVIGATION: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: "home",
        permission: "dashboard.view",
        mobilePriority: 1,
        keywords: ["home"],
      },
      {
        title: "Inbox",
        href: "/inbox",
        icon: "inbox",
        mobilePriority: 4,
        keywords: ["notifications", "approvals", "to do"],
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        title: "Audit Trail",
        href: "/admin/audit",
        icon: "history",
        permission: "audit.view",
        keywords: ["log", "history"],
      },
    ],
  },
];

export function navigationFor(user: AuthUser): NavSection[] {
  return NAVIGATION.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.permission || can(user, item.permission)),
  })).filter((section) => section.items.length > 0);
}

/** Up to 4 bottom tabs (the 5th slot is always "More"). */
export function mobileTabsFor(sections: NavSection[]): NavItem[] {
  return sections
    .flatMap((s) => s.items)
    .filter((i) => i.mobilePriority !== undefined)
    .sort((a, b) => (a.mobilePriority ?? 0) - (b.mobilePriority ?? 0))
    .slice(0, 4);
}
