import { test, expect } from "@playwright/test";
import { loginAs } from "./login";

test.describe("Admin moderation", () => {
  test("admin dashboard shows the moderation queue", async ({ page }) => {
    await loginAs(page, "admin@daddy.com");
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "תור ניהול" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "מחלוקות" })).toBeVisible();
    await expect(page.getByRole("button", { name: "דיווחי ביקורות" })).toBeVisible();
  });

  test("queue lists the seeded dispute and review flag", async ({ page }) => {
    await loginAs(page, "admin@daddy.com");
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "תור ניהול" })).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "מחלוקות" }).click();
    await expect(page.getByText("איכות העבודה")).toBeVisible();
    await expect(page.getByText(/הארון יצא עקום/)).toBeVisible();
    await expect(page.getByRole("button", { name: /שחרור לספק/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /החזר ללקוח/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^פיצול$/ })).toBeVisible();

    await page.getByRole("button", { name: "דיווחי ביקורות" }).click();
    await expect(page.getByText(/ביקורת מזויפת/)).toBeVisible();
    await expect(page.getByRole("button", { name: "דחה דיווח" })).toBeVisible();
    await expect(page.getByRole("button", { name: "הסתר ביקורת" })).toBeVisible();
  });
});
