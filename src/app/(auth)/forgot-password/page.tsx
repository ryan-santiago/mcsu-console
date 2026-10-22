import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ForgotPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Account recovery"
        title="Forgot your password?"
        description="Enter your work email and we'll send you a link to set a new one."
      />
      <ForgotPasswordForm />
    </>
  );
}
