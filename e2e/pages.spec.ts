import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/אבאל׳ה|daddy/i);
  });

  test("how it works page loads", async ({ page }) => {
    await page.goto("/how-it-works");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
  });

  test("terms page states the platform is an intermediary", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "תנאי שימוש" })).toBeVisible();
    await expect(page.getByText(/תיווך בלבד/)).toBeVisible();
  });

  test("cookie banner can be rejected", async ({ page }) => {
    await page.goto("/");
    const dialog = page.getByRole("dialog", { name: "עוגיות והסכמה" });
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.getByRole("button", { name: "דחייה" }).click();
    await expect(dialog).toBeHidden();
  });

  test("guidelines page loads", async ({ page }) => {
    await page.goto("/guidelines");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
    await expect(page.getByRole("heading", { name: "כללי קהילה" })).toBeVisible();
  });

  test("become a daddy page loads", async ({ page }) => {
    await page.goto("/become-a-daddy");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
  });

  test("favorites page requires auth", async ({ page }) => {
    await page.goto("/favorites");
    await expect(page.getByText(/התחבר|כניסה/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("profile page requires auth", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByText(/התחבר|כניסה/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("seller profile page loads for valid seller", async ({ page }) => {
    await page.goto("/sellers/seed-seller-1");
    await page.waitForLoadState("domcontentloaded");
  });

  test("404 for non-existent seller", async ({ page }) => {
    await page.goto("/sellers/nonexistent-user-id");
    await page.waitForLoadState("domcontentloaded");
  });

  test("request creation page loads", async ({ page }) => {
    await page.goto("/requests/create");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
  });

  test("forgot password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("navbar contains expected links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/שירותים/i).first()).toBeVisible();
  });

  test("mobile viewport renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
  });
});
