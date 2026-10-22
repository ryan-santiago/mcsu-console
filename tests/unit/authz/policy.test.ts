import { describe, expect, it } from "vitest";
import { PolicyError } from "@/lib/authz/errors";
import {
  assertCanAssignGroup,
  assertCanDeleteGroup,
  assertCanEditGroup,
  assertCanManageUser,
  assertNotLastSuperAdmin,
  assertValidGroupRank,
  can,
  canUseTwoFactor,
  grantableScope,
  mergeGrants,
  needsTwoFactorSetup,
  scopeCovers,
  scopeOf,
  type GroupRef,
} from "@/lib/authz/policy";
import { makeUser, superAdmin } from "./fixtures";

const group = (rank: number, extra: Partial<GroupRef> = {}): GroupRef => ({
  id: `g-${rank}`,
  rank,
  isSystem: false,
  audience: "STAFF",
  ...extra,
});

function rule(fn: () => void): string | null {
  try {
    fn();
    return null;
  } catch (error) {
    if (error instanceof PolicyError) return error.rule;
    throw error;
  }
}

describe("can / scopeOf", () => {
  it("Super Admin holds everything at ALL (R1)", () => {
    const sa = superAdmin();
    expect(can(sa, "group.delete")).toBe(true);
    expect(scopeOf(sa, "employee.view")).toBe("ALL");
  });

  it("others hold exactly their grants", () => {
    const tl = makeUser({ rank: 30, grants: { "employee.view": "TEAM" } });
    expect(can(tl, "employee.view")).toBe(true);
    expect(can(tl, "employee.update")).toBe(false);
    expect(scopeOf(tl, "employee.view")).toBe("TEAM");
    expect(scopeOf(tl, "employee.update")).toBeNull();
  });

  it("scopeCovers orders ALL ⊇ TEAM ⊇ OWN", () => {
    expect(scopeCovers("ALL", "TEAM")).toBe(true);
    expect(scopeCovers("TEAM", "TEAM")).toBe(true);
    expect(scopeCovers("OWN", "TEAM")).toBe(false);
  });
});

describe("needsTwoFactorSetup (R15)", () => {
  it.each([
    [10, false, true],
    [10, true, false],
    [0, false, true],
    [20, false, false],
    [null, false, false],
  ] as const)("employee-linked: rank %s, 2FA %s → %s", (rank, twoFactorEnabled, expected) => {
    expect(needsTwoFactorSetup(makeUser({ rank, twoFactorEnabled }))).toBe(expected);
  });

  it("never applies to accounts without employee data (e.g. service accounts)", () => {
    const service = makeUser({ rank: 0, employeeId: null, twoFactorEnabled: false });
    expect(canUseTwoFactor(service)).toBe(false);
    expect(needsTwoFactorSetup(service)).toBe(false);
    expect(canUseTwoFactor(makeUser())).toBe(true);
  });
});

describe("assertCanManageUser (R2, R3, R9)", () => {
  const target = (rank: number | null, extra: { id?: string; isSuperAdmin?: boolean } = {}) => ({
    id: extra.id ?? "u-target",
    rank,
    isSuperAdmin: extra.isSuperAdmin ?? false,
  });

  it("never yourself (R3)", () => {
    const actor = makeUser({ rank: 10 });
    expect(rule(() => assertCanManageUser(actor, target(40, { id: actor.id })))).toBe("R3");
  });

  it("pending users (no group) are manageable", () => {
    expect(rule(() => assertCanManageUser(makeUser({ rank: 30 }), target(null)))).toBeNull();
  });

  it.each([
    [10, 10, "R2"], // equal rank is never enough
    [20, 10, "R2"],
    [10, 20, null],
    [10, 40, null],
  ] as const)("actor %i on target %i → %s", (actorRank, targetRank, expected) => {
    expect(rule(() => assertCanManageUser(makeUser({ rank: actorRank }), target(targetRank)))).toBe(
      expected,
    );
  });

  it("an actor without a group can't manage grouped users", () => {
    expect(rule(() => assertCanManageUser(makeUser({ rank: null }), target(40)))).toBe("R2");
  });

  it("only a Super Admin manages another Super Admin (R9)", () => {
    const other = target(0, { isSuperAdmin: true });
    expect(rule(() => assertCanManageUser(makeUser({ rank: 10 }), other))).toBe("R2");
    expect(rule(() => assertCanManageUser(superAdmin(), other))).toBeNull();
  });
});

describe("assertNotLastSuperAdmin (R8)", () => {
  it.each([
    [true, "ACTIVE", 1, "R8"],
    [true, "ACTIVE", 2, null],
    [true, "SUSPENDED", 1, null],
    [false, "ACTIVE", 1, null],
  ] as const)("superAdmin=%s status=%s count=%i → %s", (isSuperAdmin, status, count, expected) => {
    expect(rule(() => assertNotLastSuperAdmin({ isSuperAdmin, status }, count))).toBe(expected);
  });
});

describe("assertCanAssignGroup (R4, R14)", () => {
  const staff = { type: "STAFF" as const };

  it("audience must match the user type (R14)", () => {
    const portal = group(90, { audience: "CLIENT" });
    expect(rule(() => assertCanAssignGroup(makeUser({ rank: 10 }), portal, staff))).toBe("R14");
  });

  it.each([
    [10, 10, "R4"],
    [10, 5, "R4"],
    [10, 30, null],
    [20, 30, null],
  ] as const)("actor %i assigning rank %i → %s", (actorRank, groupRank, expected) => {
    expect(
      rule(() => assertCanAssignGroup(makeUser({ rank: actorRank }), group(groupRank), staff)),
    ).toBe(expected);
  });

  it("a pending actor can't assign", () => {
    expect(rule(() => assertCanAssignGroup(makeUser({ rank: null }), group(40), staff))).toBe("R4");
  });

  it("only a Super Admin assigns the system group", () => {
    const system = group(0, { isSystem: true });
    expect(rule(() => assertCanAssignGroup(makeUser({ rank: 10 }), system, staff))).toBe("R4");
    expect(rule(() => assertCanAssignGroup(superAdmin(), system, staff))).toBeNull();
  });
});

describe("groups (R1, R5, R7)", () => {
  const admin = makeUser({ rank: 10, groupId: "g-10" });

  it("system groups are read-only (R1)", () => {
    expect(rule(() => assertCanEditGroup(superAdmin(), group(0, { isSystem: true })))).toBe("R1");
  });

  it("you can't edit your own group (R5)", () => {
    expect(rule(() => assertCanEditGroup(admin, group(10)))).toBe("R5");
  });

  it.each([
    [10, "R5"],
    [5, "R5"],
    [30, null],
  ] as const)("admin editing rank %i → %s", (rank, expected) => {
    expect(rule(() => assertCanEditGroup(admin, group(rank, { id: `other-${rank}` })))).toBe(
      expected,
    );
  });

  it("a pending actor can't edit groups", () => {
    expect(rule(() => assertCanEditGroup(makeUser({ rank: null, groupId: null }), group(40)))).toBe(
      "R5",
    );
  });

  it("re-ranking must stay below the actor (R5)", () => {
    expect(rule(() => assertCanEditGroup(admin, group(30), 10))).toBe("R5");
    expect(rule(() => assertCanEditGroup(admin, group(30), 15))).toBeNull();
  });

  it.each([
    [-1, "R5"],
    [1.5, "R5"],
    [10, "R5"],
    [11, null],
  ] as const)("new group rank %s → %s", (rank, expected) => {
    expect(rule(() => assertValidGroupRank(admin, rank))).toBe(expected);
  });

  it("a pending actor can't pick a rank", () => {
    expect(rule(() => assertValidGroupRank(makeUser({ rank: null }), 50))).toBe("R5");
  });

  it("delete needs zero users (R7) and edit rights", () => {
    expect(rule(() => assertCanDeleteGroup(admin, group(30), 2))).toBe("R7");
    expect(rule(() => assertCanDeleteGroup(admin, group(30), 0))).toBeNull();
    expect(rule(() => assertCanDeleteGroup(admin, group(5), 0))).toBe("R5");
  });
});

describe("mergeGrants (R6)", () => {
  const actor = makeUser({
    rank: 20,
    grants: { "employee.view": "TEAM", "user.view": "ALL", "project.view": "ALL" },
  });

  it("grants held permissions at the same or narrower scope, in catalog order", () => {
    const result = mergeGrants(
      actor,
      [],
      [
        { key: "project.view", scope: "OWN" },
        { key: "employee.view", scope: "TEAM" },
      ],
    );
    expect(result).toEqual([
      { key: "employee.view", scope: "TEAM" },
      { key: "project.view", scope: "OWN" },
    ]);
  });

  it("refuses a permission the actor doesn't hold", () => {
    expect(rule(() => mergeGrants(actor, [], [{ key: "group.delete", scope: "ALL" }]))).toBe("R6");
  });

  it("refuses a scope wider than the actor's", () => {
    expect(rule(() => mergeGrants(actor, [], [{ key: "employee.view", scope: "ALL" }]))).toBe("R6");
  });

  it("refuses unknown keys", () => {
    // @ts-expect-error: testing a stale/forged key
    expect(rule(() => mergeGrants(actor, [], [{ key: "nope.view", scope: "ALL" }]))).toBe("R6");
  });

  it("stores non-scopable permissions as ALL", () => {
    expect(mergeGrants(actor, [], [{ key: "user.view", scope: "OWN" }])).toEqual([
      { key: "user.view", scope: "ALL" },
    ]);
  });

  it("removes a controllable grant that wasn't requested", () => {
    expect(mergeGrants(actor, [{ key: "project.view", scope: "ALL" }], [])).toEqual([]);
  });

  it("controls existing global grants the actor holds (removable)", () => {
    expect(mergeGrants(actor, [{ key: "user.view", scope: "ALL" }], [])).toEqual([]);
  });

  it("preserves grants the actor doesn't hold", () => {
    const current = [{ key: "group.delete" as const, scope: "ALL" as const }];
    expect(mergeGrants(actor, current, [])).toEqual(current);
  });

  it("preserves grants wider than the actor's scope, even if 'removed'", () => {
    const current = [{ key: "employee.view" as const, scope: "ALL" as const }];
    expect(mergeGrants(actor, current, [])).toEqual(current);
    expect(mergeGrants(actor, current, [{ key: "employee.view", scope: "OWN" }])).toEqual(current);
  });

  it("grantableScope mirrors the actor's own scope", () => {
    expect(grantableScope(actor, "employee.view")).toBe("TEAM");
    expect(grantableScope(actor, "group.delete")).toBeNull();
  });
});
