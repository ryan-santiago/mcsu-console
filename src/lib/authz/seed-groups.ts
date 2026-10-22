/**
 * Seed groups and their grants: the matrix in docs/03-rbac.md §2a (confirmed Q26).
 * Used only to CREATE missing groups; existing groups are never touched (04 § Seed data).
 * Pure data (no "server-only") so the seed script can import it.
 */
import type { PermissionKey } from "./catalog";
import type { Scope } from "./types";

export type SeedGroup = {
  name: string;
  rank: number;
  description: string;
  isSystem?: boolean;
  isDefault?: boolean;
  grants: Partial<Record<PermissionKey, Scope>>;
};

const A = "ALL" as const;
const T = "TEAM" as const;
const O = "OWN" as const;

export const SUPER_ADMIN_GROUP = "Super Admin";

export const SEED_GROUPS: readonly SeedGroup[] = [
  {
    name: SUPER_ADMIN_GROUP,
    rank: 0,
    isSystem: true,
    description: "Break-glass full access. Holds every permission implicitly.",
    grants: {},
  },
  {
    name: "Administrator",
    rank: 10,
    description: "Every permission at ALL, still bound by the rank rules.",
    grants: {
      "dashboard.view": A,
      "employee.view": A,
      "employee.view_compensation": A,
      "employee.create": A,
      "employee.update": A,
      "employee.review_changes": A,
      "employee.deactivate": A,
      "employee.restore": A,
      "employee.export": A,
      "project.view": A,
      "project.view_financials": A,
      "project.create": A,
      "project.update": A,
      "project.delete": A,
      "onelot.view": A,
      "onelot.create": A,
      "onelot.manage": A,
      "onelot.work": A,
      "onelot.delete": A,
      "activity_report.view": A,
      "activity_report.submit": A,
      "activity_report.reopen": A,
      "activity_report.export": A,
      "staff_aug.view": A,
      "maintenance.view": A,
      "maintenance.manage": A,
      "team.manage_leads": A,
      "user.view": A,
      "user.approve": A,
      "user.update": A,
      "user.delete": A,
      "group.view": A,
      "group.create": A,
      "group.update": A,
      "group.delete": A,
      "audit.view": A,
      "settings.manage": A,
    },
  },
  {
    name: "Manager",
    rank: 20,
    description:
      "All workforce and engagement data. Approves registrations and assigns team leads. No group, audit or settings management.",
    grants: {
      "dashboard.view": A,
      "employee.view": A,
      "employee.view_compensation": A,
      "employee.create": A,
      "employee.update": A,
      "employee.review_changes": A,
      "employee.deactivate": A,
      "employee.restore": A,
      "employee.export": A,
      "project.view": A,
      "project.view_financials": A,
      "project.create": A,
      "project.update": A,
      "project.delete": A,
      "onelot.view": A,
      "onelot.create": A,
      "onelot.manage": A,
      "onelot.work": A,
      "onelot.delete": A,
      "activity_report.view": A,
      "activity_report.submit": A,
      "activity_report.reopen": A,
      "activity_report.export": A,
      "staff_aug.view": A,
      "maintenance.view": A,
      "team.manage_leads": A,
      "user.view": A,
      "user.approve": A,
      "group.view": A,
    },
  },
  {
    name: "Team Lead",
    rank: 30,
    description:
      "Their teams' employees, projects and reports, including compensation (view only). Reviews their teams' change requests.",
    grants: {
      "dashboard.view": T,
      "employee.view": T,
      "employee.view_compensation": T,
      "employee.review_changes": T,
      "employee.export": T,
      "project.view": T,
      "onelot.view": T,
      "onelot.create": A,
      "onelot.manage": T,
      "onelot.work": T,
      "activity_report.view": T,
      "activity_report.submit": A,
      "activity_report.reopen": T,
      "activity_report.export": T,
      "staff_aug.view": T,
      "maintenance.view": A,
    },
  },
  {
    name: "Employee",
    rank: 40,
    isDefault: true,
    description:
      "Default on approval. Own profile (including own salary), own reports, assigned work.",
    grants: {
      "dashboard.view": O,
      "employee.view": O,
      "employee.view_compensation": O,
      "project.view": O,
      "onelot.view": O,
      "onelot.work": O,
      "activity_report.view": O,
      "activity_report.submit": A,
      "activity_report.export": O,
    },
  },
  {
    name: "Viewer",
    rank: 50,
    description: "Read-only, own records. Auditors get audit.view through a group of their own.",
    grants: {
      "dashboard.view": O,
      "employee.view": O,
      "project.view": O,
      "onelot.view": O,
      "activity_report.view": O,
    },
  },
];
