import { describe, expect, it } from "vitest";
import {
  CATALOG,
  PERMISSION_KEYS,
  getPermission,
  isPermissionKey,
  isScopable,
} from "@/lib/authz/catalog";
import { canInOneLot, membershipAllows, oneLotWhere, rolesAllowing } from "@/lib/authz/resource";
import { SEED_GROUPS } from "@/lib/authz/seed-groups";
import { toAuthUser, type LoadedUser } from "@/lib/authz/user";
import { makeUser, superAdmin } from "./fixtures";

describe("catalog", () => {
  it("keys are unique and well-formed (resource.action)", () => {
    expect(new Set(PERMISSION_KEYS).size).toBe(CATALOG.length);
    for (const key of PERMISSION_KEYS) expect(key).toMatch(/^[a-z_]+\.[a-z_]+$/);
  });
  it("lookups", () => {
    expect(getPermission("employee.view")?.scopable).toBe(true);
    expect(getPermission("nope")).toBeUndefined();
    expect(isPermissionKey("user.view")).toBe(true);
    expect(isPermissionKey("nope")).toBe(false);
    expect(isScopable("employee.view")).toBe(true);
    expect(isScopable("user.view")).toBe(false);
  });
  it("seed groups only use catalog keys, and global keys at ALL", () => {
    for (const group of SEED_GROUPS) {
      for (const [key, scope] of Object.entries(group.grants)) {
        expect(isPermissionKey(key), `${group.name}: ${key}`).toBe(true);
        if (!getPermission(key)?.scopable) expect(scope, `${group.name}: ${key}`).toBe("ALL");
      }
    }
  });
});

describe("One-Lot membership (03 §5b)", () => {
  it.each([
    ["OWNER", "onelot.manage", true],
    ["MEMBER", "onelot.manage", false],
    ["MEMBER", "onelot.work", true],
    ["VIEWER", "onelot.work", false],
    ["VIEWER", "onelot.view", true],
    ["OWNER", "onelot.delete", false],
    ["OWNER", "onelot.create", false],
    ["OWNER", "project.view_financials", false],
    [null, "onelot.view", false],
  ] as const)("%s → %s = %s", (role, key, expected) => {
    expect(membershipAllows(role, key)).toBe(expected);
  });

  it("rolesAllowing is empty outside One-Lot", () =>
    expect(rolesAllowing("employee.view")).toEqual([]));

  it("canInOneLot = group grant in scope OR role", () => {
    const tl = makeUser({ grants: { "onelot.manage": "TEAM" } });
    expect(canInOneLot(tl, "onelot.manage", { inScope: true, role: null })).toBe(true);
    expect(canInOneLot(tl, "onelot.manage", { inScope: false, role: null })).toBe(false);
    expect(canInOneLot(makeUser(), "onelot.manage", { inScope: true, role: "OWNER" })).toBe(true);
  });

  it("oneLotWhere: ALL → everything", () =>
    expect(oneLotWhere(superAdmin(), "onelot.manage")).toEqual({}));

  it("oneLotWhere: scope OR role", () => {
    const tl = makeUser({ ledTeamIds: [], grants: { "onelot.manage": "OWN" } });
    expect(oneLotWhere(tl, "onelot.manage")).toEqual({
      OR: [
        { members: { some: { userId: "u-actor" } } },
        { members: { some: { userId: "u-actor", role: { in: ["OWNER"] } } } },
      ],
    });
  });

  it("oneLotWhere: role only when the group lacks the permission", () =>
    expect(oneLotWhere(makeUser(), "onelot.work")).toEqual({
      OR: [{ members: { some: { userId: "u-actor", role: { in: ["OWNER", "MEMBER"] } } } }],
    }));

  it("oneLotWhere: nothing when neither applies", () =>
    expect(oneLotWhere(makeUser(), "onelot.delete")).toEqual({ id: { in: [] } }));
});

describe("toAuthUser", () => {
  const base: LoadedUser = {
    id: "u1",
    email: "a@questronix.com.ph",
    name: "A",
    type: "STAFF",
    status: "ACTIVE",
    clientId: null,
    twoFactorEnabled: null,
    group: {
      id: "g1",
      name: "Team Lead",
      rank: 30,
      isSystem: false,
      grants: [
        { permissionKey: "employee.view", scope: "TEAM" },
        { permissionKey: "user.view", scope: "OWN" }, // global → normalized to ALL
        { permissionKey: "retired.permission", scope: "ALL" }, // stale → ignored
      ],
    },
    employee: { id: "e1", teamId: "t1", leads: [{ teamId: "t1" }, { teamId: "t2" }] },
  };

  it("maps grants, scope and led teams", () => {
    const user = toAuthUser(base);
    expect(user.isSuperAdmin).toBe(false);
    expect(user.rank).toBe(30);
    expect([...user.grants]).toEqual([
      ["employee.view", "TEAM"],
      ["user.view", "ALL"],
    ]);
    expect(user.ledTeamIds).toEqual(["t1", "t2"]);
    expect(user.twoFactorEnabled).toBe(false);
  });

  it("Super Admin = system group at rank 0 (never by name)", () => {
    const sa = toAuthUser({
      ...base,
      group: { ...base.group!, name: "Whatever", isSystem: true, rank: 0 },
    });
    expect(sa.isSuperAdmin).toBe(true);
    const fake = toAuthUser({
      ...base,
      group: { ...base.group!, name: "Super Admin", isSystem: false, rank: 0 },
    });
    expect(fake.isSuperAdmin).toBe(false);
  });

  it("pending users have no group, grants or rank", () => {
    const pending = toAuthUser({
      ...base,
      status: "PENDING",
      group: null,
      employee: null,
      twoFactorEnabled: true,
    });
    expect(pending.rank).toBeNull();
    expect(pending.groupId).toBeNull();
    expect(pending.groupName).toBeNull();
    expect(pending.grants.size).toBe(0);
    expect(pending.employeeId).toBeNull();
    expect(pending.ledTeamIds).toEqual([]);
    expect(pending.twoFactorEnabled).toBe(true);
  });

  it("client users keep only clientAllowed permissions and no team scope (R12)", () => {
    const client = toAuthUser({
      ...base,
      type: "CLIENT",
      clientId: "c1",
      group: {
        ...base.group!,
        grants: [
          { permissionKey: "ticket.view", scope: "ALL" },
          { permissionKey: "employee.view", scope: "ALL" },
        ],
      },
    });
    expect([...client.grants.keys()]).toEqual(["ticket.view"]);
    expect(client.employeeId).toBeNull();
    expect(client.teamId).toBeNull();
    expect(client.ledTeamIds).toEqual([]);
    expect(client.isSuperAdmin).toBe(false);
  });
});
