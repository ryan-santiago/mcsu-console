import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db";

/**
 * Organization settings stored in AppSetting (docs/modules/settings-profile.md).
 * Every key has a Zod schema and a default, so a missing or malformed row never breaks the app.
 */
const SETTINGS = {
  "org.name": { schema: z.string().min(1), default: "QSERV – MCSU" },
  "auth.allowedEmailDomains": {
    schema: z.array(z.string().min(1)).min(1),
    default: ["questronix.com.ph"],
  },
  "mar.missingDaysReminderWorkingDays": { schema: z.number().int().min(1).max(10), default: 3 },
  "mar.sendReminderDay": { schema: z.number().int().min(1).max(28), default: 3 },
  "mar.ackReminderDays": { schema: z.number().int().min(1).max(60), default: 7 },
  "staffAug.renewalThresholds": {
    schema: z.object({ soon: z.number().int().positive(), urgent: z.number().int().positive() }),
    default: { soon: 45, urgent: 30 },
  },
} as const;

export type SettingKey = keyof typeof SETTINGS;
export type SettingValue<K extends SettingKey> = z.infer<(typeof SETTINGS)[K]["schema"]>;

export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  const def = SETTINGS[key];
  const row = await prisma.appSetting.findUnique({ where: { key } });
  if (!row) return def.default as SettingValue<K>;
  const parsed = def.schema.safeParse(row.value);
  return (parsed.success ? parsed.data : def.default) as SettingValue<K>;
}

/** True when the email's domain is in auth.allowedEmailDomains (case-insensitive). */
export function isAllowedDomain(email: string, allowed: readonly string[]): boolean {
  const domain = email.trim().toLowerCase().split("@").pop() ?? "";
  return allowed.some((d) => d.trim().toLowerCase() === domain);
}
