import type { Metadata } from "next";
import { Suspense } from "react";
import { RedirectIfSignedIn } from "@/components/auth/redirect-if-signed-in";
import { AuthHeading } from "@/components/auth/auth-heading";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <AuthHeading
        eyebrow="MCSU Console"
        title="Welcome back"
        description="Sign in with your Questronix work account."
      />
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
