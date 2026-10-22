import { Inbox, ShieldCheck, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canUseTwoFactor } from "@/lib/authz/policy";
import { requirePermission } from "@/lib/authz/session";
import { getNotificationSummary } from "@/server/notifications/queries";

export const metadata: Metadata = { title: "Dashboard" };

/** Placeholder home until the Workforce dashboard (milestone 2.5). */
export default async function DashboardPage() {
  const user = await requirePermission("dashboard.view");
  const summary = await getNotificationSummary(user);
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <>
      <PageHeader title={`Welcome, ${firstName}`} description="Your MCSU Console at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1">
              <CardDescription>To do</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{summary.openActions}</CardTitle>
            </div>
            <span className="flex size-9 items-center justify-center rounded-lg bg-info-soft text-info">
              <Inbox className="size-4" aria-hidden />
            </span>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/inbox">Open inbox</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardDescription>Your access</CardDescription>
            <CardTitle className="text-lg">{user.groupName ?? "No group"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <span className="font-mono text-[11px]">rank {user.rank}</span> ·{" "}
            {user.grants.size || "all"} permissions
          </CardContent>
        </Card>

        {/* 2FA is only for users linked to an employee record. */}
        {canUseTwoFactor(user) ? (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1">
                <CardDescription>Two-factor authentication</CardDescription>
                <CardTitle className="text-lg">{user.twoFactorEnabled ? "On" : "Off"}</CardTitle>
              </div>
              <span
                className={
                  user.twoFactorEnabled
                    ? "flex size-9 items-center justify-center rounded-lg bg-success-soft text-success"
                    : "flex size-9 items-center justify-center rounded-lg bg-warning-soft text-warning"
                }
              >
                {user.twoFactorEnabled ? (
                  <ShieldCheck className="size-4" aria-hidden />
                ) : (
                  <ShieldAlert className="size-4" aria-hidden />
                )}
              </span>
            </CardHeader>
            {!user.twoFactorEnabled ? (
              <CardContent>
                <Button asChild size="sm">
                  <Link href="/settings/security/2fa-setup">Set it up</Link>
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ) : null}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Workforce and engagement dashboards arrive with those modules (roadmap 2.5).
      </p>
    </>
  );
}
