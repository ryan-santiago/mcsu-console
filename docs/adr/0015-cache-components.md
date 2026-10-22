# 0015 · Keep Next.js Cache Components on; authorization stays per request

**Status:** Accepted · 2026-10-22 · *Refines [01-architecture.md](../01-architecture.md) request lifecycle; consistent with [0006](0006-no-cached-authz.md).*

## Context
Next.js 16.4 scaffolds new apps with `cacheComponents: true` and `partialPrefetching: true`. The bundled docs say both become the only behaviour in the next major. With Cache Components:
- Reading request data (`cookies()`, `headers()`, the session) outside a `<Suspense>` boundary is a build error. A session read at the top of a layout holds the whole segment.
- The guide suggests `"use cache: private"` for the current user. That caches the user (and anything derived from it) in the browser, which would bring back the stale-authorization bug that ADR 0006 removed.

## Decision
- **Keep Cache Components and Partial Prefetching on.**
- **Static shell, dynamic user.** `(app)/layout.tsx` renders the chrome that doesn't depend on the user (sidebar frame, top bar frame, skeletons) as the static shell. Everything that needs the user (nav filtered by `can()`, user menu, page data) is rendered inside `<Suspense>` boundaries and streams in.
- **Authorization is never cached across requests.** `getCurrentUser()` uses React `cache()` (per request only). `"use cache: private"`, `"use cache"` and `"use cache: remote"` must never wrap anything that reads the session, grants, scope or scoped data. Plain `"use cache"` is allowed only for data that's the same for every user (lookups), tagged and invalidated with `updateTag` (01 § Caching).
- `src/proxy.ts` still only checks that the session cookie exists (fast redirect to `/login`). Real authorization happens on the server in `lib/authz`.
- Pages that can't be split yet may export `instant = false` (allowed to block) while they're built. Remove it before the module's Definition of Done.

## Consequences
- ➕ Future-proof for the next Next.js major. Fast first paint (prerendered shell) and partial prefetching on navigation.
- ➕ ADR 0006 still holds: a suspended or re-grouped user is cut off on their next request.
- ➖ Every authenticated page needs `<Suspense>` boundaries and skeletons. This was already required by the Definition of Done (loading states).
- ➖ Hidden routes stay mounted (React `<Activity>`), so client state survives back-navigation. Forms must reset explicitly after a successful save.
