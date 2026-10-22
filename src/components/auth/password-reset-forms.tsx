"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Field, FormError } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { IconInput, PasswordInput } from "@/components/forms/icon-input";
import { ArrowLeft, Lock, Mail, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    const { error: authError } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    if (authError) {
      setError(authError.message ?? "Couldn't send the email. Please try again.");
      return;
    }
    setSent(true);
  });

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-2xl border bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info-soft text-info">
            <MailCheck className="size-5" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, we&apos;ve sent a link to reset the password.
            It&apos;s valid for 1 hour. Check your spam folder if it doesn&apos;t arrive.
          </p>
        </div>
        <Button asChild variant="outline" size="lg" className="h-11 w-full rounded-xl">
          <Link href="/login">
            <ArrowLeft aria-hidden /> Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field id="email" label="Work email" error={formState.errors.email?.message}>
        <IconInput
          icon={Mail}
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@questronix.com.ph"
          autoFocus
          aria-invalid={!!formState.errors.email}
          {...register("email")}
        />
      </Field>
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-xl font-semibold shadow-lg shadow-primary/20"
        disabled={formState.isSubmitting}
      >
        {formState.isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token || linkError) {
    return (
      <div className="space-y-4">
        <FormError message="This reset link is invalid or has expired. Request a new one." />
        <Button asChild size="lg" className="h-11 w-full rounded-xl">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null);
    const { error: authError } = await authClient.resetPassword({ newPassword: password, token });
    if (authError) {
      setError(authError.message ?? "Couldn't reset the password. Request a new link.");
      return;
    }
    router.replace("/login?reset=1");
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <Field
        id="password"
        label="New password"
        error={formState.errors.password?.message}
        help="At least 12 characters. You'll be signed out of every device."
      >
        <PasswordInput
          icon={Lock}
          id="password"
          autoComplete="new-password"
          autoFocus
          aria-invalid={!!formState.errors.password}
          {...register("password")}
        />
      </Field>
      <Field
        id="confirmPassword"
        label="Confirm password"
        error={formState.errors.confirmPassword?.message}
      >
        <PasswordInput
          icon={Lock}
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={!!formState.errors.confirmPassword}
          {...register("confirmPassword")}
        />
      </Field>
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-xl font-semibold shadow-lg shadow-primary/20"
        disabled={formState.isSubmitting}
      >
        {formState.isSubmitting ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
