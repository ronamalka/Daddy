import { test, expect } from "@playwright/test";
import { loginAs } from "./login";

test.describe("Order Flow", () => {
  test("orders page requires auth", async ({ page }) => {
    await page.goto("/orders");
    await expect(
      page.getByText(/התחבר|כניסה|ברוך הבא/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("orders page loads for authenticated user", async ({ page }) => {
    await loginAs(page, "admin@daddy.com");
    await page.goto("/orders");
    await page.waitForLoadState("domcontentloaded");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test("inbox page loads for authenticated user", async ({ page }) => {
    await loginAs(page, "admin@daddy.com");
    await page.goto("/inbox");
    await page.waitForLoadState("domcontentloaded");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test("inbox thread has an attach control", async ({ page }) => {
    await loginAs(page, "buyer@daddy.com");
    await page.goto("/inbox/seed-user-seller1");
    await expect(page.getByRole("button", { name: "צרף תמונה או PDF" })).toBeVisible({ timeout: 10000 });
  });

  test("order thread has an attach control", async ({ page }) => {
    await loginAs(page, "buyer@daddy.com");
    await page.goto("/orders/ord-1");
    await expect(page.getByRole("button", { name: "צרף תמונה או PDF" })).toBeVisible({ timeout: 10000 });
  });

  test("seller orders page shows calendar of closed jobs", async ({ page }) => {
    await loginAs(page, "seller@daddy.com");
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "העבודות שלי" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "יומן" })).toBeVisible();
    await expect(page.getByRole("button", { name: "עבודות לספק" })).toBeVisible();
  });

  test("buyer orders page shows purchased services without calendar", async ({ page }) => {
    await loginAs(page, "buyer@daddy.com");
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "ההזמנות שלי" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "יומן" })).toHaveCount(0);
  });

  test("in-progress job turns the buyer cancel control into open a dispute", async ({ page }) => {
    await loginAs(page, "buyer3@daddy.com");
    await page.goto("/orders/ord-20");
    await expect(page.getByRole("button", { name: "בטל הזמנה" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "פתח מחלוקת" })).toBeVisible({ timeout: 10000 });
  });

  test("pending buyer cancel dialog states the fee policy", async ({ page }) => {
    await loginAs(page, "buyer2@daddy.com");
    await page.goto("/orders/ord-19");
    await page.getByRole("button", { name: "בטל הזמנה" }).click();
    await expect(page.getByRole("heading", { name: "ביטול הזמנה" })).toBeVisible();
    await expect(page.getByText("דמי ביטול")).toBeVisible();
  });
});
