# AGENTS.md: rules for AI agents and developers

Read this before changing code. If something here conflicts with a module doc, this file wins. If you change a rule, update it here.

## 0. Before you write Next.js code
Next.js 16 changed APIs (async `params`/`searchParams`/`cookies()`/`headers()`, `proxy.ts` instead of `middleware.ts`, Cache Components / `"use cache"`, Turbopack by default). **Read `node_modules/next/dist/docs/` for the installed version** before you rely on memory.

## 1. Authorization: the rules you must not break
1. **Never branch on a group name or id.** `if (user.group.name === "Team Lead")` is a bug. Use:
   - `can(user, "employee.update")`: does the user hold the permission at any scope?
   - `scopeWhere(user, "employee.view")`: the Prisma `where` that limits rows to the user's scope.
   - `assertCanManageUser` / `assertCanAssignGroup` / `assertCanEditGroup`: rank checks for users and groups.
   - The only authorization path outside group grants is One-Lot membership (`membershipAllows`, `oneLotWhere` in `src/lib/authz/resource.ts`). Don't add others without an ADR ([ADR 0013](docs/adr/0013-one-lot-resource-roles.md)).
2. **Every server action and query authorizes on the server**, through `authedAction()` / `authedQuery()` (see [docs/07-conventions.md](docs/07-conventions.md)). Hiding things in the UI is only cosmetic.
3. **Every list and detail query applies `scopeWhere`.** A record outside the user's scope returns `notFound()`, not 403, so its existence isn't leaked.
4. **Rank: a lower number means more authority.** Super Admin is `0`. Comparisons are **strict** (`actor.rank < target.rank`). Equal rank is never enough.
5. **You can only grant what you hold**, at a scope no wider than your own.
6. Permission keys exist only in `src/lib/authz/catalog.ts`. Don't hardcode permission strings in seeds, SQL or tests. Import them from the catalog.

Full spec: [docs/03-rbac.md](docs/03-rbac.md).

## 2. Data
- Prisma is the only data access path. Don't write raw SQL unless a query can't be expressed in Prisma, and if you do, wrap it in `src/server/<module>/queries.ts` with a comment.
- Every create, update or delete writes an audit entry (`recordAudit` + `diffFields`). Inside `authedAction`, call the `audit()` function it hands to the handler, which writes in the same transaction (see §4).
- Soft-delete business records (`deletedAt`; One-Lot workspaces use `archivedAt`). Hard-delete only join rows, drafts and rejected pending users.
- Store money as `Decimal(12,2)`. Store dates without a time as `@db.Date`. Store timestamps as `timestamptz` (`@db.Timestamptz(3)` on every `DateTime` that isn't a date).
- Don't store anything you can derive (gross profit, renewal status, "is resigned"). Compute it.

## 3. Code layout
```
src/app/(app)/<module>/...           routes (RSC pages, thin)
src/server/<module>/queries.ts       reads ("server-only"; authedQuery + scopeWhere)
src/server/<module>/actions.ts       writes ("use server"; authedAction)
src/lib/validation/<module>.ts       Zod schemas (shared by client and server)
src/components/<module>/...          UI for that module
src/components/ui/...                shadcn primitives (don't edit by hand except for theming)
```

## 4. Server actions
- Return `{ ok: true, data } | { ok: false, error, fieldErrors? }`. An action never throws to its caller. Inside the handler, throw the typed errors (`NotFoundError`, `ConflictError`, `PolicyError`), and `authedAction` maps them to results. Don't `redirect()` inside an action. The caller navigates.
- Validate input with the module's Zod schema, also on the server.
- After a mutation, revalidate the affected list and detail pages through the `revalidate` option of `authedAction`, which runs after the commit.
- Audit: call `audit({ module, action, entityId, entityLabel, changes })` inside the handler (same transaction).

## 5. UI
- Use shadcn primitives and theme tokens (`bg-card`, `text-muted-foreground`, `text-brand`). **Never use raw hex or Tailwind palette colours** (`bg-blue-600`) in components.
- Use brand orange only as an accent or indicator. Never use it for body text on light surfaces.
- Every page must work in light and dark mode and in all 4 palettes. See [docs/05-design-system.md](docs/05-design-system.md).
- Lists keep their state in the URL (via `nuqs`): search, filters, page, sort.
- **Mobile-first:** base styles target a 360px phone, and `md:`/`lg:` enhance. Use `<ResponsiveTable>`, `<ResponsiveDialog>` and the sticky action bar instead of raw Table/Dialog on pages. Tap targets ≥ 44px, and nothing important is hover-only. See [docs/09-mobile-and-pwa.md](docs/09-mobile-and-pwa.md).
- **The service worker must never cache authenticated responses** (RSC, actions, `/api`).

## 6. Quality gates (CI)
`pnpm check` = `typecheck` + `lint` + `test`. Policy and scope code (`src/lib/authz/**`) needs **100% branch coverage**.

## 7. Docs index
[README](README.md) · [Vision](docs/00-vision.md) · [Architecture](docs/01-architecture.md) · [Setup](docs/02-tech-stack-and-setup.md) · [RBAC](docs/03-rbac.md) · [Data model](docs/04-data-model.md) · [Design](docs/05-design-system.md) · [Roadmap](docs/06-roadmap.md) · [Conventions](docs/07-conventions.md) · [Open questions](docs/08-open-questions.md) · [Mobile & PWA](docs/09-mobile-and-pwa.md) · [Docker](docs/10-docker.md) · [AWS](docs/11-aws-deployment.md) · [ADRs](docs/adr/) · [Modules](docs/modules/)

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
