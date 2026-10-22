/** Human labels for audit modules/actions (docs/modules/audit-trail.md). Unknown keys fall back to the key. */

const MODULES: Record<string, string> = {
  auth: "Authentication",
  user: "Users",
  group: "Groups & Roles",
  maintenance: "Maintenance",
  team: "Teams",
  employee: "Employees",
  project: "Projects",
  settings: "Settings",
};

const ACTIONS: Record<string, string> = {
  login: "Signed in",
  login_failed: "Failed sign-in",
  logout: "Signed out",
  register: "Registered",
  password_reset_requested: "Requested password reset",
  password_reset: "Reset password",
  two_factor_enabled: "Enabled 2FA",
  two_factor_disabled: "Disabled 2FA",
  two_factor_failed: "Failed 2FA code",
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  approve: "Approved",
  reject: "Rejected",
  suspend: "Suspended",
  reactivate: "Reactivated",
  import: "Imported",
};

export const auditModuleLabel = (key: string) => MODULES[key] ?? key;
export const auditActionLabel = (key: string) => ACTIONS[key] ?? key.replaceAll("_", " ");

/** Badge tone per action, for the audit table. */
export function auditActionTone(action: string): "destructive" | "warning" | "success" | "info" {
  if (/failed|delete|suspend|reject/.test(action)) return "destructive";
  if (/disable|reset/.test(action)) return "warning";
  if (/create|approve|enable|register|login/.test(action)) return "success";
  return "info";
}
