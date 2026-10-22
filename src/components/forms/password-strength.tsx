import { cn } from "@/lib/utils";

/**
 * A simple, honest strength hint: length + character variety. The real gate is server-side
 * (min 12 chars + the breached-password check, Q7).
 */
export function passwordScore(password: string): 0 | 1 | 2 | 3 | 4 {
  if (password.length === 0) return 0;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  if (password.length < 12) return 1;
  if (password.length >= 16 && variety >= 3) return 4;
  return variety >= 3 ? 3 : 2;
}

const LABELS = ["", "Too short", "Fair", "Good", "Strong"] as const;
const BAR = ["", "bg-destructive", "bg-warning", "bg-info", "bg-success"] as const;
const TEXT = ["", "text-destructive", "text-warning", "text-info", "text-success"] as const;

export function PasswordStrength({ password }: { password: string }) {
  const score = passwordScore(password);
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn("h-1.5 rounded-full bg-muted", score >= step && BAR[score])}
          />
        ))}
      </div>
      <p className="flex justify-between text-xs text-muted-foreground">
        <span>At least 12 characters. Breached passwords are refused.</span>
        {score > 0 ? <span className={cn("font-medium", TEXT[score])}>{LABELS[score]}</span> : null}
      </p>
    </div>
  );
}
