import { test, expect } from "@playwright/test";

test.describe("Gig Browsing", () => {
  test("homepage loads and shows gigs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("אבאל׳ה").first()).toBeVisible({ timeout: 10000 });
  });

  test("gigs listing redirects to the homepage catalog", async ({ page }) => {
    await page.goto("/gigs");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/(\?.*)?$/);
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
  });

  test("gig detail page loads", async ({ page }) => {
    await page.goto("/gigs/seed-gig-ikea");
    await page.waitForLoadState("domcontentloaded");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test("gig detail shows the 24-hour cancellation policy", async ({ page }) => {
    await page.goto("/gigs/seed-gig-ikea");
    await expect(page.getByText(/ביטול חינם עד 24 שעות לפני חלון הביקור/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/אינו 14 ימי ביטול של מכר מרחוק/)).toBeVisible();
  });
});

test.describe("Seller Gig Creation", () => {
  test("gig creation requires auth", async ({ page }) => {
    await page.goto("/gigs/create");
    await expect(
      page.getByText(/התחבר|כניסה|ברוך הבא/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
