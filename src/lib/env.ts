import "server-only";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Server-side environment, validated at startup (docs/02-tech-stack-and-setup.md).
 * There are no NEXT_PUBLIC_* variables: public config is read here at runtime and passed to
 * client components as props, so one image runs in every environment (ADR 0014).
 */
export const env = createEnv({
  server: {
    APP_ENV: z.enum(["local", "staging", "prod"]),
    APP_URL: z.url(),
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),

    // Email via Microsoft Graph (ADR 0009). Without the Azure vars, the console driver logs mail.
    AZURE_TENANT_ID: z.string().optional(),
    AZURE_CLIENT_ID: z.string().optional(),
    AZURE_CLIENT_SECRET: z.string().optional(),
    MAIL_SENDER: z.email().optional(),
    MAIL_REPLY_TO: z.email().optional(),
    MAIL_OVERRIDE_TO: z.email().optional(),

    SENTRY_DSN: z.url().optional(),
  },
  client: {},
  experimental__runtimeEnv: {},
  // Build stage only (Dockerfile); the runtime always validates.
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
