import { ArrowDownRight, ArrowUpRight, Users } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeSwitcher } from "@/components/design/theme-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Design reference" };

// Visual reference for every token and component state (docs/05-design-system.md §8).
// Hidden in production by src/proxy.ts. Milestone 1.4 also restricts it to Super Admin.

const SWATCHES = [
  { name: "background", className: "bg-background" },
  { name: "card", className: "bg-card" },
  { name: "muted", className: "bg-muted" },
  { name: "accent", className: "bg-accent" },
  { name: "primary", className: "bg-primary" },
  { name: "brand", className: "bg-brand" },
  { name: "signal", className: "bg-signal" },
  { name: "destructive", className: "bg-destructive" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "info", className: "bg-info" },
  { name: "sidebar", className: "bg-sidebar" },
  { name: "chart-1", className: "bg-chart-1" },
  { name: "chart-2", className: "bg-chart-2" },
  { name: "chart-3", className: "bg-chart-3" },
  { name: "chart-4", className: "bg-chart-4" },
  { name: "chart-5", className: "bg-chart-5" },
] as const;

const TYPE_SCALE = [
  { label: "3xl · KPI value", className: "text-3xl font-semibold tabular-nums", sample: "1,284" },
  {
    label: "2xl · Page title",
    className: "text-2xl font-semibold tracking-tight",
    sample: "Employees",
  },
  { label: "xl", className: "text-xl font-semibold tracking-tight", sample: "Section heading" },
  { label: "lg", className: "text-lg font-semibold", sample: "Card title" },
  { label: "base", className: "text-base", sample: "Body text for forms and longer content." },
  { label: "sm · Table body", className: "text-sm", sample: "Juan Dela Cruz · Software Engineer" },
  {
    label: "xs · Help text",
    className: "text-xs text-muted-foreground",
    sample: "Lower number = more authority.",
  },
] as const;

const PILLS = [
  { label: "Active", className: "bg-success-soft text-success" },
  { label: "Renewal ≤45d", className: "bg-warning-soft text-warning" },
  { label: "Sent", className: "bg-info-soft text-info" },
  { label: "Suspended", className: "bg-destructive-soft text-destructive" },
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  delta,
  up,
}: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}) {
  const DeltaIcon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row items-start justify-between">
        <CardDescription>{label}</CardDescription>
        <span className="flex size-8 items-center justify-center rounded-lg bg-info-soft text-info">
          <Users className="size-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium ${
              up ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive"
            }`}
          >
            <DeltaIcon className="size-3" aria-hidden />
            {delta}
          </span>
          vs last month
        </p>
      </CardContent>
    </Card>
  );
}

export default function DesignPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-10 px-4 py-6 md:px-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Design reference</h1>
          <p className="text-sm text-muted-foreground">
            Tokens and components in every mode and palette. Visual regression baseline
            (Playwright).
          </p>
        </div>
        <ThemeSwitcher />
      </header>

      <Section title="Colour tokens">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {SWATCHES.map((swatch) => (
            <div key={swatch.name} className="space-y-1.5">
              <div className={`h-14 rounded-xl border ${swatch.className}`} />
              <p className="font-mono text-[11px] text-muted-foreground">{swatch.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <Card>
          <CardContent className="divide-y">
            {TYPE_SCALE.map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <span className="w-40 shrink-0 font-mono text-[11px] text-muted-foreground">
                  {row.label}
                </span>
                <span className={row.className}>{row.sample}</span>
              </div>
            ))}
            <div className="flex flex-wrap gap-3 py-3">
              {["employee.view_compensation", "rank 30", "BDO-42"].map((chip) => (
                <code key={chip} className="font-mono text-[11px] text-muted-foreground">
                  {chip}
                </code>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="outline">Secondary</Button>
          <Button variant="secondary">Muted</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Badges & status pills">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">System</Badge>
          {PILLS.map((pill) => (
            <span
              key={pill.label}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill.className}`}
            >
              {pill.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-signal" aria-hidden /> Live
          </span>
        </div>
      </Section>

      <Section title="Form controls">
        <Card>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="design-name">Full name</Label>
              <Input id="design-name" placeholder="Juan Dela Cruz" autoComplete="off" />
              <p className="text-xs text-muted-foreground">As it appears on government IDs.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="design-email">Work email</Label>
              <Input
                id="design-email"
                type="email"
                inputMode="email"
                aria-invalid
                defaultValue="juan@gmail.com"
              />
              <p className="text-xs text-destructive">Use your @questronix.com.ph address.</p>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="Dashboard tiles">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Headcount" value="128" delta="4.1%" up />
          <Kpi label="Deployed" value="86%" delta="1.2%" up />
          <Kpi label="Bench" value="11" delta="0.6%" up={false} />
          <Kpi label="Renewals ≤45d" value="7" delta="2" up={false} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>
              Cards use a generous radius, a quiet border and no heavy shadow.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Content sits on bg-card. The orange signal colour is only for indicators, never for body
            text.
          </CardContent>
        </Card>
      </Section>
    </main>
  );
}
