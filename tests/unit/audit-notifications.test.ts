import { describe, expect, it } from "vitest";
import { MASK, diffFields, maskChanges, normalizeAuditValue, requestMeta } from "@/lib/audit";
import { NOTIFICATION_EVENTS, getNotificationEvent, wantsEmail } from "@/lib/notifications/catalog";

describe("normalizeAuditValue", () => {
  it.each([
    [null, null],
    [undefined, null],
    ["", null],
    ["text", "text"],
    [12, "12"],
    [true, "true"],
    [10n, "10"],
    [new Date("2026-10-22T00:00:00.000Z"), "2026-10-22T00:00:00.000Z"],
    [["a", "b"], '["a","b"]'],
    [{ toString: () => "1234.50" }, "1234.50"], // Prisma.Decimal-like
    [{ a: 1 }, '{"a":1}'],
  ])("case %# → %s", (input, expected) => {
    expect(normalizeAuditValue(input)).toBe(expected);
  });
});

describe("diffFields", () => {
  const labels = {
    firstName: "First name",
    salary: { label: "Salary", sensitive: "compensation" as const },
  };

  it("records only changed, labelled fields", () => {
    const changes = diffFields(
      { firstName: "Juan", salary: 50000, password: "old" },
      { firstName: "Juan", salary: 55000, password: "new" },
      labels,
    );
    expect(changes).toEqual([
      {
        field: "salary",
        label: "Salary",
        oldValue: "50000",
        newValue: "55000",
        sensitive: "compensation",
      },
    ]);
  });

  it("handles create (no before) and delete (no after)", () => {
    expect(diffFields(null, { firstName: "Ana" }, labels)).toEqual([
      { field: "firstName", label: "First name", oldValue: null, newValue: "Ana" },
    ]);
    expect(diffFields({ firstName: "Ana" }, null, labels)).toEqual([
      { field: "firstName", label: "First name", oldValue: "Ana", newValue: null },
    ]);
  });
});

describe("maskChanges (read-time masking)", () => {
  const changes = [
    {
      field: "salary",
      label: "Salary",
      oldValue: "50000",
      newValue: "55000",
      sensitive: "compensation" as const,
    },
    {
      field: "allowance",
      label: "Allowance",
      oldValue: null,
      newValue: "1000",
      sensitive: "compensation" as const,
    },
    { field: "firstName", label: "First name", oldValue: "A", newValue: "B" },
  ];

  it("masks compensation for viewers without view_compensation", () => {
    expect(maskChanges(changes, false)).toEqual([
      { ...changes[0], oldValue: MASK, newValue: MASK },
      { ...changes[1], oldValue: null, newValue: MASK },
      changes[2],
    ]);
  });

  it("shows real values to viewers who may see compensation", () => {
    expect(maskChanges(changes, true)).toBe(changes);
  });
});

describe("requestMeta", () => {
  it("takes the first x-forwarded-for hop (ALB)", () => {
    const meta = requestMeta(
      new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1", "user-agent": "UA" }),
    );
    expect(meta).toEqual({ ip: "203.0.113.5", userAgent: "UA" });
  });
  it("falls back to x-real-ip, then null", () => {
    expect(requestMeta(new Headers({ "x-real-ip": "198.51.100.7" })).ip).toBe("198.51.100.7");
    expect(requestMeta(new Headers()).ip).toBeNull();
  });
});

describe("notification catalog", () => {
  it("events are unique", () => {
    const events = NOTIFICATION_EVENTS.map((e) => e.event);
    expect(new Set(events).size).toBe(events.length);
  });

  it("every ACTION event emails by default", () => {
    for (const e of NOTIFICATION_EVENTS)
      if (e.kind === "ACTION") expect(e.emailByDefault, e.event).toBe(true);
  });

  it("wantsEmail respects alwaysEmail, then preferences, then the default", () => {
    const approved = getNotificationEvent("user.approved");
    const registered = getNotificationEvent("user.registered");
    const lead = getNotificationEvent("team.lead_assigned");
    expect(wantsEmail(approved, { email: { account: false } })).toBe(true);
    expect(wantsEmail(registered, { email: { approvals: false } })).toBe(false);
    expect(wantsEmail(registered, undefined)).toBe(true);
    expect(wantsEmail(lead, {})).toBe(false);
  });

  it("unknown events throw", () => {
    // @ts-expect-error: testing a forged event name
    expect(() => getNotificationEvent("nope")).toThrow();
  });
});
