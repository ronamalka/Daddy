import { expect, test } from "@playwright/test";
import { loginAs } from "./login";

test.describe("Standing jobs", () => {
  test("buyer sets a weekly standing job from the daddy price list", async ({ page }) => {
    await loginAs(page, "buyer@daddy.com");
    await page.goto("/sellers/seed-user-seller1");
    await expect(page.getByRole("heading", { name: "יוסי הגולדן", exact: true })).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: /מחירון/ }).click();
    await expect(page.getByText("בחרו חלון ביקור של שעתיים")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /\d{2}:\d{2}/ }).first().click();
    await page.getByRole("button", { name: "עבודה קבועה" }).first().click();
    await expect(page.getByRole("heading", { name: "עבודה קבועה" })).toBeVisible();
    await expect(page.getByText("מחיר לביקור עכשיו")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/כל ביקור מחויב בנפרד/)).toBeVisible();
    await page.getByRole("button", { name: "אישור עבודה קבועה" }).click();
    await page.waitForURL(/\/standing-jobs\/[^/]+$/, { timeout: 15000 });
    await expect(page.getByText("שבועי")).toBeVisible();
    await expect(page.getByRole("link", { name: /יום / }).first()).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "השהה ביקורים עתידיים" }).click();
    await expect(page.getByText("מושהה")).toBeVisible({ timeout: 10000 });
  });
});
