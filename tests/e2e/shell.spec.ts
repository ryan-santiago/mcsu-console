import { expect, test } from "@playwright/test";
import { PERSONAS } from "../fixtures/personas";
import { signIn } from "./helpers";

/** App shell on every device project (docs/09 §2): sidebar on desktop, bottom tabs on phones. */
test("signed-in shell adapts to the device", async ({ page, isMobile }) => {
  await signIn(page, PERSONAS.employee.email, PERSONAS.employee.password);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();

  const tabs = page.getByRole("navigation", { name: "Main" });
  if (isMobile) {
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Inbox" })).toBeVisible();
    await tabs.getByRole("button", { name: "More" }).click();
    await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();
  } else {
    await expect(tabs).toBeHidden();
    await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Search…" }).click();
    await expect(page.getByPlaceholder("Search pages…")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Control+k");
    await expect(page.getByPlaceholder("Search pages…")).toBeVisible();
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
