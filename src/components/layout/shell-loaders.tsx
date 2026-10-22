import { getNotificationSummary } from "@/server/notifications/queries";
import { canUseTwoFactor } from "@/lib/authz/policy";
import { requireUser } from "@/lib/authz/session";
import { mobileTabsFor, navigationFor } from "@/lib/navigation";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SidebarNav } from "./app-sidebar";
import { CommandMenu } from "./command-menu";
import { MobileTabs } from "./mobile-tabs";
import { UserMenu } from "./user-menu";

/**
 * User-dependent parts of the shell. Each renders inside its own <Suspense> in
 * src/app/(app)/layout.tsx so the frame prerenders (ADR 0015). requireUser() is memoized per
 * request, so the user is loaded once, and it redirects pending / 2FA-required users.
 */

async function inboxBadge(userId: Parameters<typeof getNotificationSummary>[0]) {
  const summary = await getNotificationSummary(userId);
  const badges: Record<string, number> =
    summary.openActions > 0 ? { "/inbox": summary.openActions } : {};
  return { summary, badges };
}

export async function SidebarNavLoader() {
  const user = await requireUser();
  const { badges } = await inboxBadge(user);
  return <SidebarNav sections={navigationFor(user)} badges={badges} />;
}

export async function MobileTabsLoader() {
  const user = await requireUser();
  const { badges } = await inboxBadge(user);
  return <MobileTabs tabs={mobileTabsFor(navigationFor(user))} badges={badges} />;
}

export async function CommandMenuLoader() {
  const user = await requireUser();
  return <CommandMenu sections={navigationFor(user)} />;
}

export async function UserMenuLoader() {
  const user = await requireUser();
  return (
    <UserMenu
      user={{
        name: user.name,
        email: user.email,
        groupName: user.groupName,
        twoFactorEnabled: user.twoFactorEnabled,
        canUseTwoFactor: canUseTwoFactor(user),
      }}
    />
  );
}

export async function NotificationBellLoader() {
  const user = await requireUser();
  const { summary } = await inboxBadge(user);
  return <NotificationBell unread={summary.unread} latest={summary.latest} />;
}
