import { test, expect } from "@playwright/test";
import { loginAs } from "./login";

test.describe("Compare quotes", () => {
  test("buyer sees two seeded quotes side by side and can sort them", async ({ page }) => {
    await loginAs(page, "buyer@daddy.com");
    await page.goto("/requests/sreq-1");
    await expect(page.getByRole("heading", { name: "צריך עזרה בהרכבת ארון גדול" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("heading", { name: "השוואת הצעות" })).toBeVisible();
    await expect(page.getByRole("link", { name: "יוסי הגולדן" })).toBeVisible();
    await expect(page.getByRole("link", { name: "משה הכל-יכול" })).toBeVisible();
    await expect(page.getByText("בעיר תל אביב - יפו")).toBeVisible();
    await expect(page.getByText("לא באזור הבקשה")).toBeVisible();
    await expect(page.getByText("אגיע עם מקדחה")).toBeVisible();

    const cards = page.locator("article");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText("משה הכל-יכול");
    await expect(cards.nth(1)).toContainText("יוסי הגולדן");
    await expect(page.getByRole("button", { name: /קבלו את ההצעה של משה הכל-יכול ב-₪180/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /קבלו את ההצעה של יוסי הגולדן ב-₪250/ })).toBeVisible();

    const priceSort = page.getByRole("button", { name: "מחיר", exact: true });
    const ratingSort = page.getByRole("button", { name: "דירוג", exact: true });
    await expect(priceSort).toHaveAttribute("aria-pressed", "true");
    await ratingSort.click();
    await expect(ratingSort).toHaveAttribute("aria-pressed", "true");
  });
});
