import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { TwoFactorSetup } from "@/components/auth/two-factor-setup";
import { Skeleton } from "@/components/ui/skeleton";
import { canUseTwoFactor, needsTwoFactorSetup } from "@/lib/authz/policy";
import { getCurrentUser } from "@/lib/authz/session";

export const metadata: Metadata = { title: "Set up two-factor authentication" };

async function Setup() {
  const user = await getCurrentUser();
  if (!user || user.status === "SUSPENDED") redirect("/login");
  if (user.status === "PENDING") redirect("/pending");
  if (user.twoFactorEnabled || !canUseTwoFactor(user)) redirect("/dashboard");
  const required = needsTwoFactorSetup(user);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Set up two-factor authentication</h1>
      <TwoFactorSetup required={required} />
      {required ? <SignOutButton variant="ghost" className="w-full" /> : null}
    </div>
  );
}

export default function TwoFactorSetupPage() {
  return (
    <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
      <Setup />
    </Suspense>
  );
}
