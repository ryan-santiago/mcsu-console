import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3200);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

// Projects per docs/09-mobile-and-pwa.md §7. Against staging: E2E_BASE_URL=https://staging-console.<domain>.
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
    // The Release 1A flow mutates shared state (Super Admin 2FA), so it runs on desktop only.
    { name: "mobile-android", use: { ...devices["Pixel 7"] }, testIgnore: /release-1a/ },
    { name: "mobile-ios", use: { ...devices["iPhone 14"] }, testIgnore: /release-1a/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Bind to 127.0.0.1 so the dev server treats that origin as its own (allowedDevOrigins).
        command: `npx next dev --hostname 127.0.0.1 --port ${PORT}`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        // Better Auth checks the request origin against BETTER_AUTH_URL.
        env: { APP_URL: baseURL, BETTER_AUTH_URL: baseURL },
        timeout: 120_000,
      },
});
