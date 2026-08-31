import { test, expect } from "@playwright/test";
import { loginAs } from "./login";

test.describe("Order disputes", () => {
  test("buyer can open a dispute on a delivered job", async ({ page }) => {
    await loginAs(page, "buyer@daddy.com");
    await page.goto("/orders/ord-22");
    await expect(page.getByRole("button", { name: "פתיחת מחלוקת" }).or(page.getByText("מחלוקות על הזמנה זו"))).toBeVisible({ timeout: 10000 });

    const openBtn = page.getByRole("button", { name: "פתיחת מחלוקת" });
    if (await openBtn.isVisible()) {
      await openBtn.click();
      const dialog = page.getByRole("dialog", { name: "פתיחת מחלוקת" });
      await expect(dialog).toBeVisible();
      await dialog.locator("select").selectOption("QUALITY");
      await dialog.getByPlaceholder("תארו את הבעיה בפירוט...").fill("הדלת לא נסגרת אחרי המסירה");
      await dialog.getByRole("button", { name: "פתח מחלוקת" }).click();
    }

    await expect(page.getByText("מחלוקות על הזמנה זו")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "פתיחת מחלוקת" })).toHaveCount(0);
  });

  test("orders list marks a job that already has an open dispute", async ({ page }) => {
    await loginAs(page, "buyer@daddy.com");
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "ההזמנות שלי" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("מחלוקת פתוחה").first()).toBeVisible();
  });
});
