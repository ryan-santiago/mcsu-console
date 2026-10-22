import { expect, type Page } from "@playwright/test";

/**
 * Navigate and wait until the page is idle, so React has hydrated before the test types or
 * clicks (dev servers compile on first visit and can be slow, especially on Windows).
 */
export async function gotoReady(page: Page, url: string) {
  await page.goto(url, { waitUntil: "networkidle" });
}

export async function signIn(page: Page, email: string, password: string) {
  await gotoReady(page, "/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Wait for the sign-in round trip to leave /login (dashboard, /two-factor, /pending, 2FA setup).
  await expect(page).not.toHaveURL(/\/login(\?|$)/, { timeout: 15_000 });
}
