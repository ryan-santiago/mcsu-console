import { describe, expect, it } from "vitest";
import {
  easterSunday,
  lastMondayOfAugust,
  philippineHolidays,
} from "../../prisma/seed-data/holidays";

const iso = (date: Date) => date.toISOString().slice(0, 10);

describe("easterSunday", () => {
  it.each([
    [2024, "2024-03-31"],
    [2025, "2025-04-20"],
    [2026, "2026-04-05"],
    [2027, "2027-03-28"],
  ])("%i → %s", (year, expected) => {
    expect(iso(easterSunday(year))).toBe(expected);
  });
});

describe("lastMondayOfAugust", () => {
  it.each([
    [2025, "2025-08-25"],
    [2026, "2026-08-31"],
    [2027, "2027-08-30"],
  ])("%i → %s", (year, expected) => {
    expect(iso(lastMondayOfAugust(year))).toBe(expected);
  });
});

describe("philippineHolidays", () => {
  const holidays = philippineHolidays(2026);

  it("places Holy Week relative to Easter", () => {
    const byName = Object.fromEntries(holidays.map((h) => [h.name, iso(h.date)]));
    expect(byName["Maundy Thursday"]).toBe("2026-04-02");
    expect(byName["Good Friday"]).toBe("2026-04-03");
    expect(byName["Black Saturday"]).toBe("2026-04-04");
  });

  it("has unique dates (the seed relies on the unique date key)", () => {
    const dates = holidays.map((h) => iso(h.date));
    expect(new Set(dates).size).toBe(dates.length);
  });
});
