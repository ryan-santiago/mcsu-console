"use client";

import { Check, Copy, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useState } from "react";
import { Field, FormError } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";

type Step =
  | { name: "password" }
  | { name: "scan"; qr: string; secret: string; backupCodes: string[] }
  | { name: "codes"; backupCodes: string[] };

/** TOTP enrollment (R15): password → scan QR → confirm a code → save backup codes. */
export function TwoFactorSetup({ required }: { required: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: "password" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Uncontrolled input read on submit: works even if typed before hydration (slow phones).
  async function start(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setError(null);
    setPending(true);
    const { data, error: authError } = await authClient.twoFactor.enable({ password });
    setPending(false);
    if (authError || !data || data.method !== "totp") {
      setError(authError?.message ?? "Couldn't start setup. Check your password.");
      return;
    }
    const secret = new URL(data.totpURI).searchParams.get("secret") ?? "";
    const qr = await QRCode.toDataURL(data.totpURI, { margin: 1, width: 220 });
    setStep({ name: "scan", qr, secret, backupCodes: data.backupCodes });
  }

  async function confirm(value: string) {
    if (step.name !== "scan" || value.length !== 6) return;
    setError(null);
    setPending(true);
    const { error: authError } = await authClient.twoFactor.verifyTotp({ code: value });
    setPending(false);
    if (authError) {
      setError(authError.message ?? "That code didn't match. Wait for a new code and try again.");
      setCode("");
      return;
    }
    setStep({ name: "codes", backupCodes: step.backupCodes });
  }

  if (step.name === "password") {
    return (
      <form onSubmit={start} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {required
            ? "Your group has administrator rights, so two-factor authentication is required before you continue."
            : "Add a second step to your sign-in with an authenticator app."}
        </p>
        <FormError message={error} />
        <Field id="password" label="Confirm your password">
          <Input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Starting…" : "Continue"}
        </Button>
      </form>
    );
  }

  if (step.name === "scan") {
    return (
      <div className="space-y-5">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Open an authenticator app (Microsoft Authenticator, Google Authenticator, 1Password…).
          </li>
          <li>Scan this QR code, or enter the key manually.</li>
          <li>Type the 6-digit code it shows.</li>
        </ol>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL generated in the browser */}
        <img
          src={step.qr}
          alt="QR code for your authenticator app"
          width={220}
          height={220}
          className="rounded-xl border bg-card p-2"
        />
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Setup key</p>
          <code className="block rounded-lg bg-muted px-3 py-2 font-mono text-xs break-all">
            {step.secret}
          </code>
        </div>
        <FormError message={error} />
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(value) => {
            setCode(value);
            void confirm(value);
          }}
          inputMode="numeric"
          aria-label="Code from your authenticator app"
          disabled={pending}
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot key={i} index={i} className="size-11 text-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
    );
  }

  const codesText = step.backupCodes.join("\n");
  return (
    <div className="space-y-5">
      <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
        Two-factor authentication is on.
      </p>
      <div className="space-y-2">
        <p className="text-sm font-medium">Save your backup codes</p>
        <p className="text-sm text-muted-foreground">
          Each code signs you in once if you lose your phone. Store them somewhere safe. They
          won&apos;t be shown again.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-xl border bg-card p-3 font-mono text-sm">
          {step.backupCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(codesText);
              setCopied(true);
            }}
          >
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />} {copied ? "Copied" : "Copy"}
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(codesText)}`}
              download="mcsu-console-backup-codes.txt"
            >
              <Download aria-hidden /> Download
            </a>
          </Button>
        </div>
      </div>
      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          router.replace("/dashboard");
          router.refresh();
        }}
      >
        I&apos;ve saved them, continue
      </Button>
    </div>
  );
}
