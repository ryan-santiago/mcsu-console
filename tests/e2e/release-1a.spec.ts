import { expect, test, type Page } from "@playwright/test";
import { PERSONAS, REGISTRATION_PREFIX } from "../fixtures/personas";
import { gotoReady, signIn } from "./helpers";
import { totp } from "./totp";

/**
 * Release 1A end to end: auth (1.3), authz + 2FA enforcement (1.4, R15), shell (1.2),
 * audit trail (1.5) and notifications (1.5b). Serial: later steps depend on earlier ones.
 * Runs on desktop-chrome only (it mutates the Super Admin's 2FA state).
 */
test.describe.configure({ mode: "serial" });

const stamp = Date.now().toString(36);
const newUser = {
  name: `E2E Registrant ${stamp}`,
  email: `${REGISTRATION_PREFIX}${stamp}@questronix.com.ph`,
  // Random enough to never appear in the breached-password list.
  password: `Reg-${stamp}-${Math.random().toString(36).slice(2)}-Qx!`,
};
let saSecret = "";

async function enterOtp(page: Page, code: string) {
  await page.getByRole("textbox", { name: /code/i }).first().fill(code);
}

test("unauthenticated visitors are sent to login with ?next", async ({ page }) => {
  await page.goto("/admin/audit");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Faudit/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("registration refuses other email domains", async ({ page }) => {
  await gotoReady(page, "/register");
  await page.getByLabel("Full name").fill("Outside Person");
  await page.getByLabel("Work email").fill(`${stamp}@gmail.com`);
  await page.getByLabel("Password", { exact: true }).fill(newUser.password);
  await page.getByLabel("Confirm password").fill(newUser.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Registration is limited to @questronix.com.ph")).toBeVisible();
});

test("registration creates a PENDING account that can only see /pending", async ({ page }) => {
  await gotoReady(page, "/register");
  await page.getByLabel("Full name").fill(newUser.name);
  await page.getByLabel("Work email").fill(newUser.email);
  await page.getByLabel("Password", { exact: true }).fill(newUser.password);
  await page.getByLabel("Confirm password").fill(newUser.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/pending$/);
  await expect(page.getByRole("heading", { name: "Waiting for approval" })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/pending$/);
});

test("an employee-linked Super Admin must enroll in 2FA before using the app (R15)", async ({
  page,
}) => {
  await signIn(page, PERSONAS.admin.email, PERSONAS.admin.password);
  await expect(page).toHaveURL(/\/settings\/security\/2fa-setup$/);

  await page.goto("/dashboard"); // can't skip it
  await expect(page).toHaveURL(/\/settings\/security\/2fa-setup$/);

  await page.getByLabel("Confirm your password").fill(PERSONAS.admin.password);
  await page.getByRole("button", { name: "Continue" }).click();
  const key = page.locator("code").first();
  await expect(key).toBeVisible();
  saSecret = (await key.textContent())?.trim() ?? "";
  expect(saSecret).toMatch(/^[A-Z2-7]+=*$/);

  await enterOtp(page, totp(saSecret));
  await expect(page.getByText("Two-factor authentication is on.")).toBeVisible();
  await expect(page.locator("ul li").first()).toBeVisible(); // backup codes
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
});

test("approvers get an ACTION notification for the new registration (1.5b)", async ({ page }) => {
  await signInWithTotp(page);
  await page.goto("/inbox");
  await expect(page.getByText(`New registration: ${newUser.name}`)).toBeVisible();
  await expect(page.getByRole("button", { name: /Notifications, \d+ unread/ })).toBeVisible();
});

test("the audit trail records sign-ins, registration and 2FA (1.5)", async ({ page }) => {
  await signInWithTotp(page);
  await page.goto("/admin/audit?module=auth");
  const table = page.locator("table");
  await expect(table.getByText("Registered").first()).toBeVisible();
  await expect(table.getByText("Enabled 2FA").first()).toBeVisible();
  await expect(table.getByText("Signed in").first()).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toMatch(/^audit-\d{8}-\d{4}\.csv$/);
});

test("an Administrator without employee data is never asked for 2FA", async ({ page }) => {
  await signIn(page, PERSONAS.service.email, PERSONAS.service.password);
  await expect(page).toHaveURL(/\/dashboard$/);
  // Visible only: Cache Components keeps the previous route (login) mounted but hidden.
  await expect(
    page.getByText("Two-factor authentication", { exact: true }).filter({ visible: true }),
  ).toHaveCount(0);
  await page.goto("/settings/security/2fa-setup");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("an Employee can't open the audit trail (403) and doesn't see it in the nav", async ({
  page,
}) => {
  await signIn(page, PERSONAS.employee.email, PERSONAS.employee.password);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: "Audit Trail" })).toHaveCount(0);

  await page.goto("/admin/audit");
  await expect(page.getByRole("heading", { name: "You don't have access" })).toBeVisible();

  const response = await page.request.get("/api/audit/export");
  expect(response.status()).toBe(403);
});

test("sign out, then sign back in through the 2FA challenge", async ({ page }) => {
  await signInWithTotp(page);
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

async function signInWithTotp(page: Page) {
  expect(saSecret, "2FA enrollment test must run first").not.toBe("");
  await signIn(page, PERSONAS.admin.email, PERSONAS.admin.password);
  await expect(page).toHaveURL(/\/two-factor/);
  await enterOtp(page, totp(saSecret));
  await expect(page).toHaveURL(/\/dashboard$/);
}
