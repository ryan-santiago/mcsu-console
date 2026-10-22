import { describe, expect, it } from "vitest";
import {
  NOTHING,
  activityReportWhere,
  changeRequestWhere,
  deploymentWhere,
  employeeWhere,
  monthlyReportWhere,
  oneLotScopeWhere,
  projectWhere,
} from "@/lib/authz/scope";
import { makeUser, superAdmin } from "./fixtures";

const lead = (extra = {}) =>
  makeUser({
    rank: 30,
    ledTeamIds: ["t-java", "t-qa"],
    grants: {
      "employee.view": "TEAM",
      "employee.review_changes": "TEAM",
      "activity_report.view": "TEAM",
      "project.view": "TEAM",
      "onelot.view": "TEAM",
    },
    ...extra,
  });
const employee = (extra = {}) =>
  makeUser({
    grants: {
      "employee.view": "OWN",
      "employee.review_changes": "OWN",
      "activity_report.view": "OWN",
      "project.view": "OWN",
      "onelot.view": "OWN",
    },
    ...extra,
  });

describe("employeeWhere", () => {
  it("ALL → no filter", () => expect(employeeWhere(superAdmin(), "employee.view")).toEqual({}));
  it("missing permission → nothing", () =>
    expect(employeeWhere(makeUser(), "employee.view")).toEqual(NOTHING));
  it("OWN → self", () =>
    expect(employeeWhere(employee(), "employee.view")).toEqual({ id: "e-actor" }));
  it("OWN without an employee link → nothing", () =>
    expect(employeeWhere(employee({ employeeId: null }), "employee.view")).toEqual(NOTHING));
  it("TEAM → led teams OR self", () =>
    expect(employeeWhere(lead(), "employee.view")).toEqual({
      OR: [{ teamId: { in: ["t-java", "t-qa"] } }, { id: "e-actor" }],
    }));
  it("TEAM leading nothing → only self", () =>
    expect(employeeWhere(lead({ ledTeamIds: [] }), "employee.view")).toEqual({
      OR: [{ id: "e-actor" }],
    }));
  it("TEAM with no teams and no employee → nothing", () =>
    expect(employeeWhere(lead({ ledTeamIds: [], employeeId: null }), "employee.view")).toEqual(
      NOTHING,
    ));
});

describe("employee-owned resources (reports, MARs, deployments)", () => {
  const builders = [
    ["activityReportWhere", activityReportWhere],
    ["monthlyReportWhere", monthlyReportWhere],
    ["deploymentWhere", deploymentWhere],
  ] as const;

  it.each(builders)("%s follows the employee scope", (_name, build) => {
    expect(build(superAdmin(), "activity_report.view")).toEqual({});
    expect(build(makeUser(), "activity_report.view")).toEqual(NOTHING);
    expect(build(employee(), "activity_report.view")).toEqual({ employeeId: "e-actor" });
    expect(build(employee({ employeeId: null }), "activity_report.view")).toEqual(NOTHING);
    expect(build(lead(), "activity_report.view")).toEqual({
      OR: [{ employee: { teamId: { in: ["t-java", "t-qa"] } } }, { employeeId: "e-actor" }],
    });
    expect(build(lead({ ledTeamIds: [], employeeId: null }), "activity_report.view")).toEqual(
      NOTHING,
    );
  });
});

describe("changeRequestWhere (never your own)", () => {
  it("ALL excludes your own requests", () =>
    expect(changeRequestWhere(superAdmin(), "employee.review_changes")).toEqual({
      employeeId: { not: "e-actor" },
    }));
  it("ALL without an employee link sees everything", () =>
    expect(changeRequestWhere(superAdmin(), "employee.review_changes")).toEqual({
      employeeId: { not: "e-actor" },
    }));
  it("ALL for a user with no employee → no exclusion", () =>
    expect(
      changeRequestWhere(
        makeUser({ employeeId: null, grants: { "employee.review_changes": "ALL" } }),
        "employee.review_changes",
      ),
    ).toEqual({}));
  it("TEAM → led teams, excluding own", () =>
    expect(changeRequestWhere(lead(), "employee.review_changes")).toEqual({
      employeeId: { not: "e-actor" },
      employee: { teamId: { in: ["t-java", "t-qa"] } },
    }));
  it("TEAM leading nothing → nothing", () =>
    expect(changeRequestWhere(lead({ ledTeamIds: [] }), "employee.review_changes")).toEqual(
      NOTHING,
    ));
  it("OWN or missing → nothing", () => {
    expect(changeRequestWhere(employee(), "employee.review_changes")).toEqual(NOTHING);
    expect(changeRequestWhere(makeUser(), "employee.review_changes")).toEqual(NOTHING);
  });
});

describe("projectWhere", () => {
  const ownViaOneLot = {
    oneLotLinks: { some: { oneLotProject: { members: { some: { userId: "u-actor" } } } } },
  };
  const ownViaDeployment = { deployments: { some: { employeeId: "e-actor" } } };

  it("ALL / missing", () => {
    expect(projectWhere(superAdmin(), "project.view")).toEqual({});
    expect(projectWhere(makeUser(), "project.view")).toEqual(NOTHING);
  });
  it("OWN → any deployment on it, or member of a linked One-Lot", () =>
    expect(projectWhere(employee(), "project.view")).toEqual({
      OR: [ownViaDeployment, ownViaOneLot],
    }));
  it("OWN without an employee → One-Lot membership only", () =>
    expect(projectWhere(employee({ employeeId: null }), "project.view")).toEqual({
      OR: [ownViaOneLot],
    }));
  it("TEAM → assigned to a led team, or OWN match", () =>
    expect(projectWhere(lead(), "project.view")).toEqual({
      OR: [
        { teams: { some: { teamId: { in: ["t-java", "t-qa"] } } } },
        ownViaDeployment,
        ownViaOneLot,
      ],
    }));
  it("TEAM leading nothing → OWN match only", () =>
    expect(projectWhere(lead({ ledTeamIds: [] }), "project.view")).toEqual({
      OR: [ownViaDeployment, ownViaOneLot],
    }));
});

describe("oneLotScopeWhere", () => {
  const member = { members: { some: { userId: "u-actor" } } };
  it("ALL / missing / OWN", () => {
    expect(oneLotScopeWhere(superAdmin(), "onelot.view")).toEqual({});
    expect(oneLotScopeWhere(makeUser(), "onelot.view")).toEqual(NOTHING);
    expect(oneLotScopeWhere(employee(), "onelot.view")).toEqual(member);
  });
  it("TEAM → linked S3P has a led team, or member", () =>
    expect(oneLotScopeWhere(lead(), "onelot.view")).toEqual({
      OR: [
        {
          links: { some: { project: { teams: { some: { teamId: { in: ["t-java", "t-qa"] } } } } } },
        },
        member,
      ],
    }));
  it("TEAM leading nothing → member only", () =>
    expect(oneLotScopeWhere(lead({ ledTeamIds: [] }), "onelot.view")).toEqual({ OR: [member] }));
});
