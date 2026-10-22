import {
  CalendarClock,
  Headset,
  History,
  KanbanSquare,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const LINES = [
  { icon: UsersRound, title: "Staff Augmentation", text: "Deployments, renewals & MARs" },
  { icon: KanbanSquare, title: "One-Lot Projects", text: "Backlogs, sprints & boards" },
  { icon: Headset, title: "Managed Services", text: "Tickets & SLAs", soon: true },
] as const;

const TRUST = [
  { icon: ShieldCheck, label: "Two-factor sign-in" },
  { icon: UserCheck, label: "Approval-based access" },
  { icon: History, label: "Full audit trail" },
] as const;

/** Illustrative only: shows the kind of view the console gives (labelled "Example"). */
const PREVIEW_ROWS = [
  {
    initials: "JD",
    name: "J. Dela Cruz",
    client: "Client A · Java Developer",
    days: 12,
    tone: "urgent",
  },
  { initials: "MR", name: "M. Reyes", client: "Client B · QA Engineer", days: 27, tone: "urgent" },
  {
    initials: "AS",
    name: "A. Santos",
    client: "Client C · Business Analyst",
    days: 41,
    tone: "soon",
  },
] as const;

/**
 * The QSERV quadrant mark as a large line drawing: the brand motif behind the stage
 * (the way Gintong Araw uses its sun rays). Decorative only.
 */
function QuadrantMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden className={className}>
      <defs>
        <linearGradient
          id="hero-quad"
          x1="0"
          y1="0"
          x2="400"
          y2="400"
          gradientUnits="userSpaceOnUse"
        >
          {/* stop-color can't take var() as an attribute; it has to go through style. */}
          <stop offset="0" style={{ stopColor: "var(--hero-glow-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--hero-glow-2)" }} />
        </linearGradient>
      </defs>
      {/* Four rounded quadrants with a notch in the middle, echoing the QSERV mark */}
      <path d="M30 70a40 40 0 0 1 40-40h110v150H30z" stroke="url(#hero-quad)" strokeWidth="3" />
      <path
        d="M220 30h110a40 40 0 0 1 40 40v110H260a40 40 0 0 1-40-40z"
        stroke="url(#hero-quad)"
        strokeWidth="3"
      />
      <path
        d="M30 220h110a40 40 0 0 1 40 40v110H70a40 40 0 0 1-40-40z"
        stroke="url(#hero-quad)"
        strokeWidth="3"
      />
      <path d="M220 220h150v110a40 40 0 0 1-40 40H220z" stroke="url(#hero-quad)" strokeWidth="3" />
      {[90, 130, 170].map((r) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r + 60}
          stroke="url(#hero-quad)"
          strokeOpacity="0.25"
        />
      ))}
    </svg>
  );
}

function RenewalsPreview() {
  return (
    <div className="hero-float w-full max-w-sm rounded-2xl border border-hero-border bg-hero-card p-4 shadow-2xl ring-1 ring-black/20 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarClock className="size-4" aria-hidden />
          </span>
          Renewals due · 45 days
        </span>
        <span className="rounded-full border border-hero-border px-2 py-0.5 text-[10px] tracking-wide text-hero-muted uppercase">
          Example
        </span>
      </div>
      <ul className="space-y-2">
        {PREVIEW_ROWS.map((row) => (
          <li
            key={row.initials}
            className="flex items-center gap-3 rounded-xl bg-hero-card px-3 py-2"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hero-border text-xs font-semibold">
              {row.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{row.name}</span>
              <span className="block truncate text-xs text-hero-muted">{row.client}</span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                row.tone === "urgent"
                  ? "bg-signal text-signal-foreground"
                  : "bg-hero-border text-hero-foreground",
              )}
            >
              {row.days}d
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The auth "brand stage" (docs/05 §1): always dark, echoing the master artwork's blue/orange
 * glow. Built in CSS + SVG so it never crops at odd widths.
 */
export function AuthHero({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "hero-stage relative isolate flex flex-col overflow-hidden text-hero-foreground",
        className,
      )}
    >
      <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <QuadrantMotif className="pointer-events-none absolute -right-48 -bottom-48 -z-10 size-168 opacity-45" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 -z-10 size-96 rounded-full bg-[radial-gradient(circle,var(--hero-glow-1),transparent_65%)] opacity-40"
      />

      <div className="flex min-h-0 flex-1 flex-col gap-8 p-10 xl:px-14 xl:py-12">
        <div className="flex items-center justify-between gap-4">
          <Image
            src="/brand/logo-white.png"
            alt="QNX Questronix · QSERV-MCSU"
            width={1484}
            height={264}
            className="h-auto w-60 xl:w-72"
            priority
          />
          <span className="hidden items-center gap-2 rounded-full border border-hero-border bg-hero-card px-3 py-1 text-xs text-hero-muted backdrop-blur xl:inline-flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-signal" />
            </span>
            Questronix internal
          </span>
        </div>

        <div className="my-auto grid items-end gap-8 min-[1600px]:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid gap-8">
            <div className="max-w-xl space-y-5">
              <p className="text-xs font-semibold tracking-[0.2em] text-hero-muted uppercase">
                QSERV – MCSU Operations Console
              </p>
              <h2 className="text-4xl leading-[1.1] font-semibold tracking-tight xl:text-[3.25rem]">
                One console for every{" "}
                <span className="bg-linear-to-r from-(--hero-glow-1) via-hero-foreground to-(--hero-glow-2) bg-clip-text text-transparent">
                  engagement
                </span>
                .
              </h2>
              <p className="max-w-md text-base text-hero-muted">
                Staff augmentation, delivery projects and managed services in one place, with the
                right access for every role.
              </p>
            </div>

            <ul className="grid max-w-xl grid-cols-3 gap-3">
              {LINES.map(({ icon: Icon, title, text, ...rest }) => (
                <li
                  key={title}
                  className="relative rounded-2xl border border-hero-border bg-hero-card p-4 backdrop-blur transition-colors hover:bg-hero-border"
                >
                  {"soon" in rest ? (
                    <span className="absolute top-3 right-3 rounded-full bg-signal px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-signal-foreground uppercase">
                      Soon
                    </span>
                  ) : null}
                  <span className="mb-3 flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <span className="block text-sm leading-snug font-semibold">{title}</span>
                  <span className="mt-1 block text-xs text-hero-muted">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Beside the content on wide screens; below it only when there's vertical room. */}
          <div className="hidden min-[1600px]:block [@media(min-height:960px)]:block">
            <RenewalsPreview />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-hero-border pt-6">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 text-xs text-hero-muted">
                <Icon className="size-4 text-hero-foreground" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
          <p className="text-xs text-hero-muted">Questronix · QSERV – MCSU</p>
        </div>
      </div>
    </aside>
  );
}

/** Compact brand band shown above the form on phones and tablets (< lg). */
export function AuthHeroBand() {
  return (
    <div className="hero-stage relative isolate overflow-hidden px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-16 text-hero-foreground lg:hidden">
      <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <QuadrantMotif className="pointer-events-none absolute -right-24 -bottom-32 -z-10 size-80 opacity-30" />
      <Image
        src="/brand/logo-white.png"
        alt="QNX Questronix · QSERV-MCSU"
        width={1484}
        height={264}
        className="h-auto w-52"
        priority
      />
      <p className="mt-6 text-2xl font-semibold tracking-tight">
        One console for every engagement.
      </p>
      <p className="mt-1 text-sm text-hero-muted">QSERV – MCSU Operations Console</p>
    </div>
  );
}
