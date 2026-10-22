# 05 · Design system

**Goal:** a calm, professional, slightly "tech" console. Dense data, generous rounding, quiet borders, one strong brand colour, and the orange accent kept for indicators. It's modelled on the reference dashboards (the Groups & Roles screens and the "Subly" analytics dashboard), translated into QSERV-MCSU branding.

## 1. Brand

| Asset | File | Use |
|---|---|---|
| Full lockup | `public/brand/logo.png` | Light surfaces (login, light sidebar header expanded) |
| Full lockup, white | `public/brand/logo-white.png` | Dark/brand surfaces |
| Mark (QSERV quadrant) | `public/brand/mark.png` / `mark-white.png` | Collapsed sidebar, favicon, apple-icon, loading |
| Master artwork | `public/brand/master.png` | Auth page hero only |
| QNX logo | `public/brand/qnx-logo.png` | Footer / about |

The `<Logo variant="auto" />` component picks colour or white from the resolved theme. **TODO (Phase 1):** ask design or marketing for SVG versions. PNGs blur at large sizes and can't be recoloured.

| Brand colour | Hex | OKLCH | Rule |
|---|---|---|---|
| QSERV Blue | `#000FBE` | `oklch(0.3701 0.2458 264.17)` | Primary actions, active nav, focus ring (light) |
| Blue (dark mode lift) | `#4A5CFF` | `oklch(0.565 0.2392 271.36)` | Primary on dark surfaces |
| Signal Orange | `#FE4F00` | `oklch(0.668 0.2211 37.49)` | **Accent only:** badges, chart series 2, notification dot, "live" indicators, highlights. Never body text on light backgrounds |
| Navy | `#05061F` | `oklch(0.1418 0.0534 274.86)` | Dark background base |
| Navy soft | `#0A0D33` | `oklch(0.1865 0.0738 273.34)` | Dark cards and sidebar |

## 2. Typography
- **UI:** *Plus Jakarta Sans* (`next/font/google`, variable). It's geometric and modern, close to the reference screenshots.
- **Mono:** *JetBrains Mono*, used for permission keys (`employee.view`), codes (`BDO-42`, S3P numbers) and ranks.
- Scale: `text-xs` 12 · `sm` 14 (body default in tables) · `base` 15 · `lg` 18 · `xl` 20 · `2xl` 24 (page title) · `3xl` 30 (KPI values). Headings `font-semibold tracking-tight`. Numbers use `tabular-nums`.

## 3. Theming model
Two independent axes, both applied on `<html>`:
- **Mode:** `class="light|dark"` via `next-themes` (`system` default).
- **Palette:** `data-palette="qserv|ember|midnight|graphite"` (default `qserv`).

Both are saved in `User.preferences` (and in a cookie to avoid a flash). They can be changed from the top-bar theme menu and **Settings → Appearance**, which shows four swatch cards with a live preview.

```css
/* globals.css (sketch) */
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));

:root,[data-palette="qserv"] {            /* light */
  --background: oklch(0.9765 0.0054 274.97);  --foreground: oklch(0.2149 0.0453 276.28);
  --card: oklch(1 0 0);                       --border: oklch(0.9266 0.015 277.84);
  --primary: oklch(0.3701 0.2458 264.17);     --primary-foreground: oklch(1 0 0);
  --accent-signal: oklch(0.668 0.2211 37.49); /* orange */
  --sidebar: oklch(1 0 0);
  --chart-1: var(--primary); --chart-2: var(--accent-signal);
  --chart-3: oklch(0.5992 0.2181 272.93); --chart-4: oklch(0.7254 0.1797 44.3); --chart-5: oklch(0.7179 0.1481 277.32);
  --radius: 0.875rem;
}
.dark, .dark[data-palette="qserv"] {
  --background: oklch(0.1418 0.0534 274.86);  /* navy */
  --card: oklch(0.1865 0.0738 273.34);        /* navy soft */
  --border: oklch(1 0 0 / 8%);
  --primary: oklch(0.565 0.2392 271.36);
  --sidebar: oklch(0.1628 0.0358 276.6);
}
[data-palette="ember"]    { --primary: oklch(0.668 0.2211 37.49); --primary-foreground: oklch(0.1418 0.0534 274.86); --accent-signal: oklch(0.3701 0.2458 264.17); }
.dark[data-palette="ember"] { --primary: oklch(0.7254 0.1797 44.3); --accent-signal: oklch(0.565 0.2392 271.36); }
[data-palette="midnight"] { /* deeper navy surfaces, electric-blue primary, higher contrast */ }
[data-palette="graphite"] { /* neutral greys (chroma ≈ 0), QSERV blue primary — for long sessions/print */ }
```

| Palette | Mood | Primary | Accent | Surfaces (dark) |
|---|---|---|---|---|
| **QSERV Blue** (default) | Brand | Blue | Orange | Navy / navy-soft |
| **Ember** | Warm, energetic | Orange (dark text on it) | Blue | Navy |
| **Midnight** | Ops / NOC | Electric blue `#4A5CFF` | Cyan-ish info | Near-black navy `#04051A` |
| **Graphite** | Neutral, low-distraction | Blue | Orange | Neutral `#111214` |

Every palette must pass **WCAG AA**: 4.5:1 for text and 3:1 for UI. A Vitest test parses the token sets and checks contrast pairs (`foreground/background`, `primary-foreground/primary`, `muted-foreground/card`).

Semantic tokens shared by all palettes: `success`, `warning`, `destructive`, `info`, plus `*-soft` variants (10–15% alpha) for badge backgrounds, like the green and amber pills in the reference.

## 4. Layout shell
```
┌──────────────┬───────────────────────────────────────────────────────────────┐
│ [mark] MCSU  │ [⇤]  🔍 Search employees, projects, BDO-42…   Ctrl K   ☾ 🔔² (RS) Ryan S. ▾│
│ Console      ├───────────────────────────────────────────────────────────────┤
│              │ Page title                                   [Secondary] [+ Primary]│
│ OVERVIEW     │ Subtitle / breadcrumb                                         │
│  Dashboard   │                                                               │
│ WORKFORCE    │  content (max-w-[1400px], px-6, gap-6)                        │
│  Employees   │                                                               │
│  Projects    │                                                               │
│ ENGAGEMENT   │                                                               │
│  Staff Aug   │                                                               │
│  One-Lot  ▸  │                                                               │
│ PRODUCTIVITY │                                                               │
│  My Reports  │                                                               │
│  Monitoring  │                                                               │
│ ADMIN        │                                                               │
│  Users       │                                                               │
│  Groups&Roles│                                                               │
│  Maintenance │                                                               │
│  Audit Trail │                                                               │
│  Settings    │                                                               │
│ ┌──────────┐ │                                                               │
│ │Log today │ │  ← brand CTA card (gradient blue→navy, orange glow)           │
│ │[+ Report]│ │    "Log today's activity" for users with activity_report.submit│
│ └──────────┘ │                                                               │
└──────────────┴───────────────────────────────────────────────────────────────┘
```
- The sidebar is the shadcn `Sidebar` (collapsible to icons, mobile sheet). Section headers are uppercase `text-[11px] tracking-wider text-muted-foreground`. The active item uses `bg-sidebar-accent` with a 2px primary indicator.
- Nav items are filtered by `can()` from `src/lib/navigation.ts`. Empty sections are hidden.
- **Command palette (Ctrl/⌘ K):** jump to pages, search employees, projects and work items (scoped), and actions such as "New employee".
- Top bar: sidebar toggle, search trigger, theme menu (mode + palette), notifications popover, and a user menu (profile, appearance, sign out) showing name and group.

## 5. Dashboard patterns (from the Subly reference)
- **KPI tile:** label + small icon chip (top-right, tinted `*-soft`), big value (`text-3xl font-semibold tabular-nums`), delta pill (`↗ 12%` success / `↘ 0.6%` destructive) + "vs last month".
- **Chart card:** title, period select on the right, chart body. Bar or dot-matrix charts use `--chart-1`, and the highlighted point uses `--accent-signal` with a tooltip chip.
- **Gauge/donut card:** e.g. "Workforce utilisation", with legend chips below.
- **Tri-card row:** e.g. "Top projects by headcount" or "Renewals due" as three mini cards with a footer button.
- **Recent list card:** avatar or initial chip, name, meta, date, status pill.

**Workforce dashboard (Phase 2) widgets:**
- Headcount, Deployed %, Bench, Renewals ≤45d
- Headcount trend
- Deployment by client
- Renewal pipeline
- MAR submission status this month
- One-Lot health (open items, sprint progress)

All widgets are **scope-aware**: a Team Lead's dashboard shows only their teams.

## 6. Component rules
- **Cards:** `rounded-2xl border bg-card p-5`, no heavy shadows (`shadow-xs` at most). In dark mode, borders are `white/8%`.
- **Buttons:** primary is filled; secondary is `variant="outline"` on card. Destructive icon buttons use `bg-destructive/10 text-destructive` squares (like the delete buttons in the reference).
- **Tables:** sticky header, 44px rows, zebra off, row hover `bg-muted/40`, and a toolbar with search, filters, view toggle (table/cards) and export. Empty states have an icon, a sentence and an action.
- **Badges/pills:** `rounded-full px-2 py-0.5 text-xs font-medium` with `*-soft` backgrounds.
- **Forms:** two-column on ≥lg, labels above, help text in `text-muted-foreground text-xs`, inline errors. Primary action bottom-right, plus a sticky footer on long forms.
- **Mono chips:** permission keys, ranks and codes use `font-mono text-[11px] text-muted-foreground`.
- **Motion:** 150–200ms ease-out, `prefers-reduced-motion` honoured.
- **Icons:** lucide, 16px in nav and tables, 18px in buttons.
- **Accessibility:** focus ring visible in every palette, all interactive elements reachable by keyboard, kanban drag has keyboard alternatives (dnd-kit sensors + "Move to…" menu).

## 7. Mobile
The layout shell above is the **≥ 1024px** version. Phones get a top app bar, a **bottom tab bar** (Home · Reports · Work · Inbox · More), card lists instead of tables, bottom drawers instead of dialogs, and FAB primary actions. The full spec is [09-mobile-and-pwa.md](09-mobile-and-pwa.md).

## 8. Deliverable in Phase 1
A `/design` route (Super Admin only, non-prod) that shows every token, palette, component state and dashboard widget **at phone and desktop widths**. It's the visual regression baseline for Playwright screenshots.
