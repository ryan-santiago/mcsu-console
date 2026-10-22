import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ResetPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Account recovery"
        title="Set a new password"
        description="You'll be signed out of every other device."
      />
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
