import { test, expect } from "@playwright/test";
import { loginAs } from "./login";

const LOCAL_REVIEW_COMMENT = "השידה בסלון יציבה לגמרי אחרי ההרכבה";

test.describe("Local job reviews", () => {
  test("buyer completes a local job, leaves a 1–10 review, and it shows on the profile", async ({ page }) => {
    test.setTimeout(90000);
    await loginAs(page, "buyer@daddy.com");
    await page.goto("/orders/ord-23");
    await expect(page.getByText("הרכבת שידה בסלון")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("תמונות מהביקור")).toBeVisible();
    await expect(page.getByText("השידה מורכבת ומפולסת")).toBeVisible();

    const completeBtn = page.getByRole("button", { name: "אשר קבלה" });
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    const writeReview = page.getByRole("button", { name: "כתוב חוות דעת" });
    await expect(writeReview).toBeVisible({ timeout: 10000 });
    await writeReview.click();

    await expect(page.getByText("לחץ על הציון המתאים בכל קריטריון (1-10)")).toBeVisible();
    await page.waitForTimeout(3500);

    for (const label of ["איכות", "יחס", "זמנים", "מחיר"]) {
      await page.getByRole("radio", { name: `${label}: 9 מתוך 10` }).click();
    }
    await page.getByPlaceholder("ספר על החוויה שלך").fill(LOCAL_REVIEW_COMMENT);
    await page.getByRole("button", { name: "שלח חוות דעת" }).click();

    await expect(page.getByText(LOCAL_REVIEW_COMMENT)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("9/10").first()).toBeVisible();

    await page.goto("/sellers/seed-user-seller1");
    await expect(page.getByRole("button", { name: "חוות דעת" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(LOCAL_REVIEW_COMMENT)).toBeVisible();
    await expect(page.getByText("9/10").first()).toBeVisible();
  });
});
