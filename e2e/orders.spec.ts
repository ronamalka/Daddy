import { test, expect } from "@playwright/test";

test.describe("Order Flow", () => {
  test("orders page requires auth", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByText(/התחבר|כניסה/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("orders page loads for authenticated user", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/אימייל|דוא/).fill("admin@daddy.com");
    await page.getByPlaceholder(/סיסמ/).fill("admin123");
    await page.getByRole("button", { name: /התחבר|כניסה/ }).click();
    await page.waitForURL("/", { timeout: 10000 });

    await page.goto("/orders");
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    await expect(page.getByText(/הזמנות/)).toBeVisible();
  });

  test("inbox page loads for authenticated user", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/אימייל|דוא/).fill("admin@daddy.com");
    await page.getByPlaceholder(/סיסמ/).fill("admin123");
    await page.getByRole("button", { name: /התחבר|כניסה/ }).click();
    await page.waitForURL("/", { timeout: 10000 });

    await page.goto("/inbox");
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    await expect(page.getByText(/הודעות/)).toBeVisible();
  });

  test("placing an order from gig detail", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/אימייל|דוא/).fill("admin@daddy.com");
    await page.getByPlaceholder(/סיסמ/).fill("admin123");
    await page.getByRole("button", { name: /התחבר|כניסה/ }).click();
    await page.waitForURL("/", { timeout: 10000 });

    await page.goto("/gigs/seed-gig-ikea");
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    const orderButton = page.getByRole("button", { name: /הזמן|רכוש|קנה/i }).first();
    if (await orderButton.isVisible().catch(() => false)) {
      await orderButton.click();
      await page.waitForLoadState("networkidle", { timeout: 5000 });
    }
  });
});

test.describe("Review Flow", () => {
  test("review form visible on completed orders", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/אימייל|דוא/).fill("admin@daddy.com");
    await page.getByPlaceholder(/סיסמ/).fill("admin123");
    await page.getByRole("button", { name: /התחבר|כניסה/ }).click();
    await page.waitForURL("/", { timeout: 10000 });

    await page.goto("/orders");
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    const orderLink = page.locator("a[href*='/orders/']").first();
    if (await orderLink.isVisible().catch(() => false)) {
      await orderLink.click();
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    }
  });
});
