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
});
