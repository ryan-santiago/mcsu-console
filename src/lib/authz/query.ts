import "server-only";
import type { PermissionKey } from "./catalog";
import { requirePermission } from "./session";
import type { AuthUser } from "./types";

/**
 * authedQuery: the ONLY way to read (docs/07-conventions.md). Requires an active user with the
 * permission (else the 403 page), then hands the handler the user. Handlers MUST apply the
 * matching scope builder (employeeWhere, projectWhere, …) and call notFound() for out-of-scope
 * detail records, so their existence isn't leaked (AGENTS.md §1.3).
 */
export function authedQuery<A extends unknown[], R>(
  permission: PermissionKey,
  handler: (user: AuthUser, ...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return async (...args) => {
    const user = await requirePermission(permission);
    return handler(user, ...args);
  };
}
