import type { Metadata } from "next";
import { Suspense } from "react";
import { RedirectIfSignedIn } from "@/components/auth/redirect-if-signed-in";
import { AuthHeading, RegistrationSteps } from "@/components/auth/auth-heading";
import { RegisterForm } from "@/components/auth/register-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getSetting } from "@/server/settings";

export const metadata: Metadata = { title: "Create an account" };

async function RegisterFormWithDomains() {
  const allowedDomains = await getSetting("auth.allowedEmailDomains");
  return <RegisterForm allowedDomains={allowedDomains} />;
}

export default function RegisterPage() {
  return (
    <>
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <AuthHeading
        eyebrow="Join MCSU Console"
        title="Create your account"
        description="Every account is approved by an administrator before first sign-in."
      />
      <RegistrationSteps />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <RegisterFormWithDomains />
      </Suspense>
    </>
  );
}
