"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleCheck, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Field, FormError } from "@/components/forms/field";
import { IconInput, PasswordInput } from "@/components/forms/icon-input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { loginSchema, safeNext } from "@/lib/validation/auth";

type Values = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const { data, error: authError } = await authClient.signIn.email(values);
    if (authError) {
      setError(authError.message ?? "Sign-in failed. Check your email and password.");
      return;
    }
    // With 2FA on, the twoFactorClient plugin redirects to /two-factor instead.
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) return;
    router.replace(next);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {params.get("reset") === "1" ? (
        <p className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2.5 text-sm text-success">
          <CircleCheck className="size-4 shrink-0" aria-hidden />
          Your password was reset. Sign in with the new one.
        </p>
      ) : null}
      <FormError message={error} />

      <Field id="email" label="Work email" error={formState.errors.email?.message}>
        <IconInput
          icon={Mail}
          id="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="you@questronix.com.ph"
          autoFocus
          aria-invalid={!!formState.errors.email}
          {...register("email")}
        />
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          icon={Lock}
          id="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          aria-invalid={!!formState.errors.password}
          {...register("password")}
        />
        {formState.errors.password ? (
          <p role="alert" className="text-xs text-destructive">
            {formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        className="group h-11 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20"
        disabled={formState.isSubmitting}
      >
        {formState.isSubmitting ? (
          "Signing in…"
        ) : (
          <>
            Sign in
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </>
        )}
      </Button>

      <div className="relative py-1 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
        <span className="relative bg-background px-3 text-xs text-muted-foreground">
          New to MCSU Console?
        </span>
      </div>

      <Button asChild variant="outline" size="lg" className="h-11 w-full rounded-xl">
        <Link href="/register">Create an account</Link>
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-success" aria-hidden />
        Administrators sign in with two-factor authentication.
      </p>
    </form>
  );
}
