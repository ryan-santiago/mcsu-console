"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { Field, FormError } from "@/components/forms/field";
import { IconInput, PasswordInput } from "@/components/forms/icon-input";
import { PasswordStrength } from "@/components/forms/password-strength";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { registerSchema } from "@/lib/validation/auth";

type Values = z.infer<typeof registerSchema>;

export function RegisterForm({ allowedDomains }: { allowedDomains: string[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, control } = useForm<Values>({
    resolver: zodResolver(registerSchema),
  });
  const password = useWatch({ control, name: "password" }) ?? "";
  const domains = allowedDomains.map((d) => `@${d}`).join(", ");

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setError(null);
    const { error: authError } = await authClient.signUp.email({ name, email, password });
    if (authError) {
      setError(authError.message ?? "Registration failed. Please try again.");
      return;
    }
    router.replace("/pending");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormError message={error} />

      <Field id="name" label="Full name" error={formState.errors.name?.message}>
        <IconInput
          icon={UserRound}
          id="name"
          autoComplete="name"
          placeholder="Juan Dela Cruz"
          autoFocus
          aria-invalid={!!formState.errors.name}
          {...register("name")}
        />
      </Field>

      <Field
        id="email"
        label="Work email"
        error={formState.errors.email?.message}
        help={`Use your ${domains} address.`}
      >
        <IconInput
          icon={Mail}
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={`you${domains.split(",")[0] ?? ""}`}
          aria-invalid={!!formState.errors.email}
          {...register("email")}
        />
      </Field>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <PasswordInput
          icon={Lock}
          id="password"
          autoComplete="new-password"
          aria-invalid={!!formState.errors.password}
          aria-describedby="password-strength"
          {...register("password")}
        />
        {formState.errors.password ? (
          <p role="alert" className="text-xs text-destructive">
            {formState.errors.password.message}
          </p>
        ) : (
          <div id="password-strength">
            <PasswordStrength password={password} />
          </div>
        )}
      </div>

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
        className="group h-11 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20"
        disabled={formState.isSubmitting}
      >
        {formState.isSubmitting ? (
          "Creating account…"
        ) : (
          <>
            Create account
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
