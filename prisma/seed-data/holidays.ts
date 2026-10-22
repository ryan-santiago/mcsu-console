// Philippine holidays with fixed or computable dates. Eid'l Fitr / Eid'l Adha and any one-off
// proclamations change every year: admins add them in Maintenance → Holidays after the annual
// Proclamation is published. Verify this list against that Proclamation each year.
type HolidayType = "REGULAR" | "SPECIAL_NON_WORKING";
type SeedHoliday = { date: Date; name: string; type: HolidayType };

const d = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day));

/** Easter Sunday (anonymous Gregorian algorithm). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const dd = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - dd - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return d(year, month, day);
}

/** Last Monday of August (National Heroes Day). */
export function lastMondayOfAugust(year: number): Date {
  const date = d(year, 8, 31);
  while (date.getUTCDay() !== 1) date.setUTCDate(date.getUTCDate() - 1);
  return date;
}

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

export function philippineHolidays(year: number): SeedHoliday[] {
  const easter = easterSunday(year);
  return [
    { date: d(year, 1, 1), name: "New Year's Day", type: "REGULAR" },
    { date: addDays(easter, -3), name: "Maundy Thursday", type: "REGULAR" },
    { date: addDays(easter, -2), name: "Good Friday", type: "REGULAR" },
    { date: addDays(easter, -1), name: "Black Saturday", type: "SPECIAL_NON_WORKING" },
    { date: d(year, 4, 9), name: "Araw ng Kagitingan", type: "REGULAR" },
    { date: d(year, 5, 1), name: "Labor Day", type: "REGULAR" },
    { date: d(year, 6, 12), name: "Independence Day", type: "REGULAR" },
    { date: d(year, 8, 21), name: "Ninoy Aquino Day", type: "SPECIAL_NON_WORKING" },
    { date: lastMondayOfAugust(year), name: "National Heroes Day", type: "REGULAR" },
    { date: d(year, 11, 1), name: "All Saints' Day", type: "SPECIAL_NON_WORKING" },
    { date: d(year, 11, 30), name: "Bonifacio Day", type: "REGULAR" },
    {
      date: d(year, 12, 8),
      name: "Feast of the Immaculate Conception",
      type: "SPECIAL_NON_WORKING",
    },
    { date: d(year, 12, 24), name: "Christmas Eve", type: "SPECIAL_NON_WORKING" },
    { date: d(year, 12, 25), name: "Christmas Day", type: "REGULAR" },
    { date: d(year, 12, 30), name: "Rizal Day", type: "REGULAR" },
    { date: d(year, 12, 31), name: "Last Day of the Year", type: "SPECIAL_NON_WORKING" },
  ];
}
