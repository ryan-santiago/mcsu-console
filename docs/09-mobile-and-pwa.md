# 09 · Mobile & PWA

MCSU Console is **mobile-first and installable**. An employee should be able to log today's activity, check their MAR, update a work item or approve a request from their phone in under a minute, without opening a laptop.

## 1. Goals
| Goal | Measure |
|---|---|
| Every screen usable at **360px** width | No horizontal page scroll; all actions reachable |
| The top-5 phone tasks are fast | Log today · View/submit my MAR · My work items · Approvals inbox · Notifications: ≤ 3 taps from home |
| Installable on Android, iOS, desktop | Passes Chrome installability; iOS "Add to Home Screen" with icon and splash |
| Feels native | Standalone display, safe-area aware, no layout jump, Lighthouse PWA/perf ≥ 90 on mid-range Android |
| Works on bad connections | App shell + offline page; **daily activity drafts saved offline** and synced later |

## 2. Breakpoints & layout
Tailwind defaults, designed **mobile-first** (base styles = phone, then `md:`/`lg:` enhance).

| Width | Shell | Navigation |
|---|---|---|
| `< 768px` (phone) | Top app bar (logo mark, page title, search icon, avatar) + **bottom tab bar** | Bottom tabs: **Home · Reports · Work · Inbox · More** (More opens a full-height sheet with the full sidebar tree) |
| `768–1023px` (tablet) | Collapsed icon sidebar (rail) + top bar | Rail with tooltips; sheet for the full tree |
| `≥ 1024px` (desktop) | Full sidebar + top bar (see [05 §4](05-design-system.md#4-layout-shell)) | Sidebar |

Bottom tabs are **permission-aware** (same `can()` filter as the sidebar). A user without activity reports sees *Employees* in that slot, a client user sees *Tickets*, and so on. The tab set comes from `navigation.ts` via a `mobilePriority` field.

## 3. Mobile component patterns
| Desktop | Phone equivalent |
|---|---|
| Data table | **Card list** (`<ResponsiveTable>` renders `<Table>` ≥ md, `<CardList>` < md from the same column defs: the primary field is the title, 2–3 fields are meta, status is a pill, actions go in a `⋯` menu) |
| Dialog | **Bottom drawer** (`vaul` Drawer via a `<ResponsiveDialog>` wrapper) |
| Filter bar | "Filters" button → drawer with the same controls, plus an active-filter chip row |
| Page header actions | Primary action becomes a **floating action button** (bottom-right, above the tab bar); secondary actions go into `⋯` |
| Multi-column forms | Single column, **sticky bottom action bar** (Save/Cancel), correct `inputMode`/`autocomplete`/`type` (tel, email, date) so the right keyboard opens |
| Kanban board | Horizontal **snap-scroll columns** (one column ≈ 85vw), long-press to drag, plus a **"Move to…"** action on every card (no drag required) |
| Backlog drag-reorder | "Move up/down / to sprint…" menu; drag handle only ≥ md |
| Calendar month grid | **Agenda list** by day < md; month grid ≥ md |
| Charts (dashboard) | Stacked full-width cards, simplified (sparkline + number); tap for detail |
| Hover tooltips | Tap-to-reveal popovers. Nothing important is hover-only |
| Group editor permission grid | One column; module sections collapsible; scope selector as a segmented control under each row |

**Touch & ergonomics rules**
- Tap targets ≥ **44×44px**. List rows ≥ 56px on phone.
- Primary actions sit in the **thumb zone** (bottom bar / FAB), never only at the top-right.
- Use `env(safe-area-inset-*)` padding for the bottom tab bar and sticky bars (iPhone home indicator). `viewport-fit=cover`.
- Use `100dvh` (not `100vh`) for full-height layouts.
- Respect `prefers-reduced-motion`. Pull-to-refresh is off (it conflicts with scroll lists). Use explicit refresh buttons on lists.
- Font size ≥ 16px in inputs (prevents iOS zoom on focus).

## 4. Phone-first flows
1. **Log today** (Employee): Home → "Log today" card → prefilled date, status chips (Present / Leave / Holiday), time in/out pickers, items as an add-another list → Save. **Works offline** (draft queued).
2. **My MAR**: Reports tab → current month summary (days logged / missing highlighted) → Preview PDF → Submit.
3. **My work**: Work tab → items assigned to me across One-Lots, grouped by status → tap → detail drawer → change status / comment.
4. **Approvals inbox**: Inbox tab → unified list (pending users, MARs, profile change requests, later tickets) → swipe or buttons Approve / Return, with a note.
5. **Notifications**: Inbox tab, second segment → deep links into the item.

The Home screen on phone is a **personal dashboard**: today's log status, MAR progress, my open work items, pending approvals (if any), and renewals due (if scoped).

## 5. PWA

### 5.1 Manifest
`src/app/manifest.ts` (Next built-in `MetadataRoute.Manifest`):
```ts
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MCSU Console",
    short_name: "MCSU",
    description: "QSERV – MCSU operations console",
    id: "/",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#05061F",   // navy (splash)
    theme_color: "#000FBE",        // QSERV blue
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Log today", url: "/activity-reports/new?date=today", icons: [{ src: "/icons/sc-log.png", sizes: "96x96" }] },
      { name: "My work", url: "/my-work", icons: [{ src: "/icons/sc-work.png", sizes: "96x96" }] },
      { name: "Approvals", url: "/inbox", icons: [{ src: "/icons/sc-inbox.png", sizes: "96x96" }] },
    ],
    screenshots: [ /* 1 narrow + 1 wide, for richer install UI */ ],
  };
}
```
- Icons are generated from `public/brand/mark.png` on a navy rounded tile (a `scripts/build-pwa-icons.mjs` step, like mcsu-app's `build-brand-assets.mjs`). Maskable icons keep the mark inside the 80% safe zone.
- `theme-color` meta switches per mode: `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#05061F">` and light `#F6F7FB`. It's updated at runtime when the user changes mode or palette.
- iOS: `apple-touch-icon` (180px), `appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "MCSU" }` in root `metadata`, and splash images per device size.

### 5.2 Service worker
**Approach:** start with a small hand-written `public/sw.js` (the pattern in the official Next.js PWA guide), registered from a client component. Move to **Serwist** only if precaching or routing grows complex (check its Turbopack support at that time).

| Request | Strategy |
|---|---|
| Static assets (`/_next/static/*`, fonts, icons, brand) | Cache-first (immutable, hashed) |
| App shell / navigations | **Network-first**, falling back to a cached `/offline` page |
| RSC payloads, server actions, `/api/*` | **Network only. Never cached** (authenticated, scoped data) |
| Images from storage proxy | Network only (they're authz-checked) |

**Security rules for the SW**
- Never cache authenticated responses (they hold personal and salary data).
- On **sign-out**, post a message to the SW to clear all caches and IndexedDB drafts.
- `sw.js` is served with `Cache-Control: no-cache` and a strict `Service-Worker-Allowed: /`. CSP allows `worker-src 'self'`.

**Updates:** the new SW waits. The app shows a toast "A new version is available · Reload". Clicking it triggers `skipWaiting`, then reloads. A forced reload is never done mid-form.

### 5.3 Offline drafts (daily activity reports)
- The activity report form autosaves to **IndexedDB** (`idb-keyval`) per `employeeId+date`.
- When offline, Save queues the draft and shows a "Saved on this device · will sync" badge.
- On reconnect (`online` event, or Background Sync where supported), the queue replays through the normal server action. Conflicts (a server row exists and is newer) open a merge prompt.
- Scope: only this flow in Phase 2. Other modules show the offline banner and disable mutations.

### 5.4 Push notifications (Phase 2.6)
- Web Push with VAPID (`web-push` on the server). Subscriptions are stored in `PushSubscription { id, userId, endpoint, p256dh, auth, userAgent, createdAt }`.
- Opt-in from Settings → Notifications (never prompt on first load). There's a per-category toggle: approvals, MAR reminders, renewals, mentions/assignments, tickets.
- iOS: push works only for the **installed** PWA (iOS 16.4+). The settings page explains this.
- The payload carries only an id and title. The app fetches details after opening, so no sensitive data goes through the push service.

### 5.5 Install experience
- Android/desktop: capture `beforeinstallprompt` and show a subtle "Install MCSU Console" item in the user menu and on the Home screen (dismissible, remembered).
- iOS: a one-time hint sheet ("Tap Share → Add to Home Screen") when on Safari and not standalone.

## 6. Performance budget (mobile)
- First load JS for the app shell ≤ **170 KB gzip**. Heavy modules (Tiptap, dnd-kit, charts, PDF preview) are lazy-loaded with `next/dynamic`.
- LCP ≤ 2.5s on throttled 4G / mid-range Android. CLS ≤ 0.1. INP ≤ 200ms.
- Skeletons (`loading.tsx`) on every route. Use streaming RSC with `<Suspense>` per dashboard card.
- Images via `next/image` with explicit sizes. Employee photos are served as 96px/256px variants.

## 7. Testing
- **Playwright projects:** `desktop-chrome`, `mobile-android` (Pixel 7), `mobile-ios` (iPhone 14 WebKit). Persona e2e suites run on desktop plus at least one mobile project.
- Visual snapshots of `/design` at 390px and 1280px in light and dark.
- Lighthouse CI against **staging** after each deploy (PWA installability, performance ≥ 90, accessibility ≥ 95).
- Manual checklist per release on a real Android and iPhone: install, offline log-today, push, update toast, safe areas.
