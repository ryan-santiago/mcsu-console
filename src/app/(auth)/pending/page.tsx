import { Clock } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/authz/session";

export const metadata: Metadata = { title: "Waiting for approval" };

async function PendingStatus() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "ACTIVE") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-warning-soft text-warning">
        <Clock className="size-6" aria-hidden />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Waiting for approval</h1>
        <p className="text-sm text-muted-foreground">
          Thanks, {user.name}. Your account ({user.email}) was created and is waiting for an
          administrator to approve it. You&apos;ll get an email when it&apos;s ready.
        </p>
      </div>
      <SignOutButton className="w-full" />
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
      <PendingStatus />
    </Suspense>
  );
}
