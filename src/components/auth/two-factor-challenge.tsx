"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormError } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { backupCodeSchema, safeNext, totpSchema } from "@/lib/validation/auth";

/** Second step of sign-in when 2FA is enabled: TOTP code, or a one-time backup code. */
export function TwoFactorChallenge() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(value: string) {
    setError(null);
    const parsed = (mode === "totp" ? totpSchema : backupCodeSchema).safeParse({ code: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid code.");
      return;
    }
    setPending(true);
    const result =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({ code: parsed.data.code, trustDevice })
        : await authClient.twoFactor.verifyBackupCode({ code: parsed.data.code, trustDevice });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "That code didn't work. Try again.");
      setCode("");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(code);
      }}
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Two-factor authentication</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "totp"
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter one of your backup codes. Each code works once."}
        </p>
      </div>
      <FormError message={error} />
      {mode === "totp" ? (
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(value) => {
            setCode(value);
            if (value.length === 6) void submit(value);
          }}
          autoFocus
          inputMode="numeric"
          aria-label="Authentication code"
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot key={i} index={i} className="size-11 text-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      ) : (
        <Input
          aria-label="Backup code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="one-time-code"
          autoFocus
        />
      )}
      <div className="flex items-center gap-2">
        <Checkbox
          id="trust"
          checked={trustDevice}
          onCheckedChange={(v) => setTrustDevice(v === true)}
        />
        <Label htmlFor="trust" className="font-normal">
          Trust this device for 30 days
        </Label>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Verifying…" : "Verify"}
      </Button>
      <Button
        type="button"
        variant="link"
        className="w-full"
        onClick={() => {
          setMode(mode === "totp" ? "backup" : "totp");
          setCode("");
          setError(null);
        }}
      >
        {mode === "totp" ? "Use a backup code instead" : "Use the authenticator app"}
      </Button>
    </form>
  );
}
