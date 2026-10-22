/**
 * The permission catalog: the ONE source of truth for permission keys (docs/03-rbac.md §3).
 * Synced to the Permission table by the seed on every deploy (stale keys are deleted).
 * Never hardcode permission strings elsewhere; use PermissionKey / import from here.
 *
 * Pure data (no "server-only") so the seed script can import it.
 */

export type PermissionDef = {
  key: string;
  module: string;
  label: string;
  /** Scopable permissions take ALL / TEAM / OWN. Global ones are stored as ALL. */
  scopable: boolean;
  /** Client-portal users may hold only these (R12, Phase 3). */
  clientAllowed?: boolean;
};

export const CATALOG = [
  { key: "dashboard.view", module: "Dashboard", label: "View dashboard widgets", scopable: true },

  { key: "employee.view", module: "Employees", label: "List and view employees", scopable: true },
  {
    key: "employee.view_compensation",
    module: "Employees",
    label: "View salary and allowances",
    scopable: true,
  },
  { key: "employee.create", module: "Employees", label: "Add employees", scopable: false },
  {
    key: "employee.update",
    module: "Employees",
    label: "Edit employee profile, employment & deployment history",
    scopable: true,
  },
  {
    key: "employee.review_changes",
    module: "Employees",
    label: "Review self-service profile change requests",
    scopable: true,
  },
  {
    key: "employee.deactivate",
    module: "Employees",
    label: "Resign / soft-delete an employee",
    scopable: true,
  },
  {
    key: "employee.restore",
    module: "Employees",
    label: "Restore a deactivated employee",
    scopable: false,
  },
  {
    key: "employee.export",
    module: "Employees",
    label: "Export the employee list",
    scopable: true,
  },

  {
    key: "project.view",
    module: "Projects (S3P)",
    label: "List and view projects",
    scopable: true,
  },
  {
    key: "project.view_financials",
    module: "Projects (S3P)",
    label: "View contract price, cost, gross profit",
    scopable: true,
  },
  { key: "project.create", module: "Projects (S3P)", label: "Create projects", scopable: false },
  {
    key: "project.update",
    module: "Projects (S3P)",
    label: "Edit projects, contract lines, team assignment",
    scopable: true,
  },
  { key: "project.delete", module: "Projects (S3P)", label: "Archive projects", scopable: true },

  { key: "onelot.view", module: "One-Lot", label: "View One-Lot workspaces", scopable: true },
  { key: "onelot.create", module: "One-Lot", label: "Create a One-Lot workspace", scopable: false },
  {
    key: "onelot.manage",
    module: "One-Lot",
    label: "Settings, members, linked S3Ps, sprints, board columns",
    scopable: true,
  },
  {
    key: "onelot.work",
    module: "One-Lot",
    label: "Create/edit work items, comment, upload documents",
    scopable: true,
  },
  { key: "onelot.delete", module: "One-Lot", label: "Archive a One-Lot workspace", scopable: true },

  {
    key: "activity_report.view",
    module: "Activity Reports",
    label: "View activity reports (OWN = mine)",
    scopable: true,
  },
  {
    key: "activity_report.submit",
    module: "Activity Reports",
    label: "Log own daily activity, finalize own MAR",
    scopable: false,
  },
  {
    key: "activity_report.reopen",
    module: "Activity Reports",
    label: "Reopen a sent MAR; record a client acknowledgment",
    scopable: true,
  },
  {
    key: "activity_report.export",
    module: "Activity Reports",
    label: "Generate MAR PDF / monitoring export",
    scopable: true,
  },

  {
    key: "staff_aug.view",
    module: "Staff Augmentation",
    label: "View deployments and the renewal board",
    scopable: true,
  },

  { key: "maintenance.view", module: "Maintenance", label: "View lookup tables", scopable: false },
  {
    key: "maintenance.manage",
    module: "Maintenance",
    label: "Create / edit / deactivate lookups",
    scopable: false,
  },
  { key: "team.manage_leads", module: "Maintenance", label: "Assign team leads", scopable: false },

  { key: "user.view", module: "Users", label: "List users", scopable: false },
  {
    key: "user.approve",
    module: "Users",
    label: "Approve / reject registrations",
    scopable: false,
  },
  {
    key: "user.update",
    module: "Users",
    label: "Change group, suspend / reactivate, link employee",
    scopable: false,
  },
  { key: "user.delete", module: "Users", label: "Delete users", scopable: false },

  {
    key: "group.view",
    module: "Groups & Roles",
    label: "View groups and their permissions",
    scopable: false,
  },
  { key: "group.create", module: "Groups & Roles", label: "Create groups", scopable: false },
  {
    key: "group.update",
    module: "Groups & Roles",
    label: "Edit group details and permissions",
    scopable: false,
  },
  { key: "group.delete", module: "Groups & Roles", label: "Delete groups", scopable: false },

  { key: "audit.view", module: "Audit", label: "View audit trail", scopable: false },
  {
    key: "settings.manage",
    module: "Settings",
    label: "Organization-wide settings",
    scopable: false,
  },

  // Managed Services (Phase 3): reserved now so groups can be planned.
  {
    key: "ticket.view",
    module: "Managed Services",
    label: "View tickets",
    scopable: true,
    clientAllowed: true,
  },
  {
    key: "ticket.create",
    module: "Managed Services",
    label: "Raise tickets",
    scopable: false,
    clientAllowed: true,
  },
  {
    key: "ticket.update",
    module: "Managed Services",
    label: "Update tickets (clients: comment and reopen own)",
    scopable: true,
    clientAllowed: true,
  },
  { key: "ticket.assign", module: "Managed Services", label: "Assign tickets", scopable: true },
  { key: "ticket.close", module: "Managed Services", label: "Close tickets", scopable: true },
] as const satisfies readonly PermissionDef[];

export type PermissionKey = (typeof CATALOG)[number]["key"];
export type ScopablePermissionKey = Extract<(typeof CATALOG)[number], { scopable: true }>["key"];

const BY_KEY: ReadonlyMap<string, PermissionDef> = new Map(CATALOG.map((p) => [p.key, p]));

export function getPermission(key: string): PermissionDef | undefined {
  return BY_KEY.get(key);
}

export function isPermissionKey(key: string): key is PermissionKey {
  return BY_KEY.has(key);
}

export function isScopable(key: PermissionKey): key is ScopablePermissionKey {
  return BY_KEY.get(key)?.scopable === true;
}

export const PERMISSION_KEYS: readonly PermissionKey[] = CATALOG.map((p) => p.key);
