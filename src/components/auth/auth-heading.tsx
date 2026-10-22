import type { ReactNode } from "react";

/** Title block shared by the auth screens. */
export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="mb-8 space-y-2">
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">{eyebrow}</p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

/** "What happens next" for self-registration (ADR 0004): register → approval → sign in. */
export function RegistrationSteps() {
  const steps = [
    { title: "Create your account", text: "With your company email." },
    { title: "Wait for approval", text: "An administrator assigns your access." },
    { title: "Sign in", text: "We email you when it's ready." },
  ];
  return (
    <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="How registration works">
      {steps.map((step, i) => (
        <li key={step.title} className="relative rounded-xl border bg-card p-3">
          <span
            className={
              i === 0
                ? "mb-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                : "mb-2 flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
            }
          >
            {i + 1}
          </span>
          <span className="block text-xs font-medium">{step.title}</span>
          <span className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
            {step.text}
          </span>
        </li>
      ))}
    </ol>
  );
}
