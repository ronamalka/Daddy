import { test, expect } from "@playwright/test";
import { stubCookieConsent } from "./cookies";

test.describe("City catalog search", () => {
  test.beforeEach(async ({ page }) => {
    await stubCookieConsent(page);
  });

  test("homepage results use a city picker, sort, and price tags", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "ארון שמסרב להתרכב" }).click();
    await expect(page.getByRole("heading", { name: "הרכבת רהיטים" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel("חיפוש לפי עיר")).toBeVisible();
    await expect(page.getByLabel("מיון תוצאות")).toBeVisible();
    await expect(page.getByRole("button", { name: "כל מחיר" })).toBeVisible();
    await expect(page.getByRole("button", { name: "מחיר קבוע" })).toBeVisible();
    await expect(page.getByRole("button", { name: "הצעת מחיר" })).toBeVisible();
    await expect(page.getByText("יוסי הגולדן")).toBeVisible();
    await expect(page.getByText("משה הכל-יכול")).toBeVisible();
    await expect(page.getByText(/החל מ-₪\s*200/)).toBeVisible();
  });

  test("price range and quote filters change the result list", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "ארון שמסרב להתרכב" }).click();
    await expect(page.getByRole("heading", { name: "הרכבת רהיטים" })).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "עד ₪100" }).click();
    await expect(page.getByText("גם אבא לא מצא")).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "₪100–250" }).click();
    await expect(page.getByText("יוסי הגולדן")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("משה הכל-יכול")).toBeVisible();

    await page.getByRole("button", { name: "הצעת מחיר" }).click();
    await expect(page.getByText("גם אבא לא מצא")).toBeVisible({ timeout: 10000 });
  });

  test("provider search API filters by city and price independently of the UI", async ({ page }) => {
    await page.goto("/");
    const telAviv = await page.request.get(
      "/api/providers?service=furniture-assembly&cityCode=5000&district=5"
    );
    expect(telAviv.ok()).toBeTruthy();
    const telAvivIds = ((await telAviv.json()) as { id: string }[]).map((p) => p.id);
    expect(telAvivIds).toContain("seed-user-seller1");
    expect(telAvivIds).not.toContain("seed-user-seller4");

    const eilat = await page.request.get(
      "/api/providers?service=furniture-assembly&cityCode=2600&district=6&sortBy=distance"
    );
    expect(eilat.ok()).toBeTruthy();
    const eilatRows = (await eilat.json()) as { id: string; matchTier?: string }[];
    expect(eilatRows.some((p) => p.id === "seed-user-seller4" && p.matchTier === "district")).toBe(true);
  });
});
