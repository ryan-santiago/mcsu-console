# 07 · Conventions

## TypeScript
- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` off (it fights Prisma types).
- Don't use `any`. Use `unknown` + Zod at boundaries.
- Import the Prisma client only from `@/lib/db`, and types from `@/generated/prisma`.
- `server-only` at the top of every `queries.ts`, `lib/authz/*`, `lib/audit.ts` and `lib/db.ts`.

## Naming
| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `employee-form.tsx` |
| Components | PascalCase | `EmployeeForm` |
| Server actions | verb + noun | `createEmployee`, `approveUser` |
| Queries | `get*` (one), `list*` (many) | `listEmployees`, `getEmployee` |
| Permission keys | `resource.action` | `employee.view_compensation` |
| DB tables | snake_case via `@@map` | `employee_deployment` |

## Server actions: the `authedAction` wrapper
```ts
// src/lib/authz/action.ts
export function authedAction<S extends z.ZodTypeAny, R>(
  opts: { permission: PermissionKey | PermissionKey[]; schema: S },
  handler: (ctx: { user: AuthUser; input: z.infer<S>; tx: Tx; audit: AuditFn }) => Promise<R>,
): (input: z.input<S>) => Promise<ActionResult<R>>;

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "CONFLICT" | "UNKNOWN"; message?: string; fieldErrors?: Record<string, string[]> };
```
Usage:
```ts
"use server";
export const updateEmployee = authedAction(
  { permission: "employee.update", schema: employeeUpdateSchema },
  async ({ user, input, tx, audit }) => {
    const before = await tx.employee.findFirst({ where: { id: input.id, ...scopeWhere(user, "employee.update") } });
    if (!before) throw new NotFoundError();           // mapped to { ok:false, error:"NOT_FOUND" }
    const after = await tx.employee.update({ where: { id: input.id }, data: toEmployeeData(input) });
    await audit({ module: "employee", action: "update", entityId: after.id, entityLabel: fullName(after), changes: diffFields(before, after, EMPLOYEE_FIELD_LABELS) });
    revalidatePath("/employees"); revalidatePath(`/employees/${after.id}`);
    return { id: after.id };
  },
);
```
- Expected failures throw typed errors (`NotFoundError`, `ConflictError`, `PolicyError`), which the wrapper maps to results. Unknown errors are logged to Sentry and returned as `UNKNOWN`. Stack traces never reach the client.
- Clients call actions through `useActionMutation(action)` (TanStack Query `useMutation` + sonner toasts + RHF `setError` for `fieldErrors`).

## Queries
- Default to RSC: the page calls `listEmployees(params)` directly.
- Pagination is server-side: `{ page, pageSize ≤ 100, sort, q, filters }` parsed by a Zod `searchParamsSchema` via `nuqs` cache.
- Return **DTOs**, not raw Prisma rows. Apply field guards (compensation, financials) in the mapper.

## Validation
- Schemas live in `src/lib/validation/<module>.ts`, named `<entity><Purpose>Schema` (`employeeCreateSchema`).
- Philippine specifics ported from mcsu-app `src/lib/validation/ph.ts` (mobile `09XXXXXXXXX`, PSGC codes).

## Audit
- Every mutation records `{ module, action, entityId, entityLabel, changes[] }`. The actor, IP and user agent are filled automatically.
- `diffFields(before, after, labels)` only records changed, labelled fields. **Never log secrets.** Salaries are logged as `"•••"` changes unless the viewer has `employee.view_compensation`.
- Auth events (`login`, `logout`, `login_failed`, `password_reset`) are recorded via Better Auth hooks.

## Errors & UX
- `error.tsx` per route group, `not-found.tsx` and `forbidden.tsx` (Next `forbidden()` API).
- Toasts for action results. Inline field errors for validation.
- Optimistic UI only for board and backlog moves (with rollback).

## Testing
| Layer | Tool | What |
|---|---|---|
| Unit | Vitest | `lib/authz/**` (100% branches), `diffFields`, renewal status, MAR aggregation, Zod schemas |
| Integration | Vitest + Postgres 17 (GitHub Actions service container / local Docker `db`) | `scopeWhere` against real data fixtures, actions end-to-end |
| E2E | Playwright (desktop + Pixel 7 + iPhone 14 projects) | Login per persona (Super Admin, Admin, Team Lead A, Team Lead B, Employee), scoped visibility, rank-rule denials, visual snapshots of `/design` |

Fixture personas live in `tests/fixtures/personas.ts` and are reused by integration and e2e tests.

## Git & delivery
- Trunk-based: short-lived branches `feat/…`, `fix/…`, `docs/…`. PRs into `main`, squash merge.
- **Conventional Commits** (`feat(employees): add deployment history`), enforced by commitlint.
- Every PR: CI must be green (typecheck, lint, unit + integration tests, Docker build), and one reviewer approves. Merges to `main` auto-deploy to **staging**. Release tags deploy to **production** after manual approval.
- Migrations: `prisma migrate dev --name <change>`. Never edit an applied migration. Destructive changes use expand → migrate → contract across two releases.
- Releases are tagged `vX.Y.Z`, and `CHANGELOG.md` is generated from commits.

## Security checklist
- Authz on the server for every action, query, route handler and download.
- Rate-limit login, registration and password reset (Better Auth `rateLimit`).
- Sanitize rich text on save (`sanitize-html` allowlist) and render with Tiptap's read-only renderer.
- Validate uploads: allowlisted MIME types, size limits, randomized storage keys, served with `Content-Disposition: attachment` through an authorized route.
- Security headers via `next.config.ts` (CSP, HSTS, frame-ancestors none).
- Secrets only in env vars. `.env*` is git-ignored except `.env.example`.
