import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label above, control, then help or error text (docs/05 §6 Forms). */
export function Field({
  id,
  label,
  error,
  help,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  error?: string | undefined;
  help?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : help ? (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {help}
        </p>
      ) : null}
    </div>
  );
}

/** Form-level error banner. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}
