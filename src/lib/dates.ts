import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

/** The app timezone (docs/04-data-model.md § Data rules). */
export const APP_TIME_ZONE = "Asia/Manila";

/** Format an instant in Manila time, regardless of the server's or browser's timezone. */
export function formatManila(date: Date, pattern: string): string {
  return format(new TZDate(date, APP_TIME_ZONE), pattern);
}
