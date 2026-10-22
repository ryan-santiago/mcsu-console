import { expect, test } from "@playwright/test";

test("health endpoints respond", async ({ request }) => {
  await expect(request.get("/api/health")).resolves.toBeOK();
  await expect(request.get("/api/ready")).resolves.toBeOK();
});

test("home redirects signed-out visitors to the login page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("design page switches palette and mode without horizontal scroll", async ({ page }) => {
  await page.goto("/design");
  await expect(page.getByRole("heading", { name: "Design reference" })).toBeVisible();

  await page.getByRole("button", { name: "Ember" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "ember");

  await page.getByRole("button", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  // The palette survives a reload (pre-paint script reads localStorage).
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "ember");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
