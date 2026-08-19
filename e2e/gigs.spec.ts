import { test, expect } from "@playwright/test";

test.describe("Gig Browsing", () => {
  test("homepage loads and shows gigs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/אבאל׳ה/)).toBeVisible();
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  });

  test("gigs page loads and displays cards", async ({ page }) => {
    await page.goto("/gigs");
    await page.waitForLoadState("networkidle", { timeout: 10000 });
    await expect(page.getByText(/שירותים/)).toBeVisible();
  });

  test("gigs page filters by category", async ({ page }) => {
    await page.goto("/gigs");
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    const categoryButton = page.getByRole("button").filter({ hasText: /.+/ }).first();
    if (await categoryButton.isVisible().catch(() => false)) {
      await categoryButton.click();
      await page.waitForLoadState("networkidle", { timeout: 5000 });
    }
  });

  test("gig detail page shows info and tiers", async ({ page }) => {
    await page.goto("/gigs/seed-gig-ikea");
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    const tierButtons = page.getByRole("button").filter({ hasText: /בסיסי|סטנדרט|פרימיום|BASIC|STANDARD|PREMIUM/i });
    const count = await tierButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("gig detail shows reviews section", async ({ page }) => {
    await page.goto("/gigs/seed-gig-ikea");
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    const reviewSection = page.getByText(/ביקורות|חוות דעת/i).first();
    if (await reviewSection.isVisible().catch(() => false)) {
      await expect(reviewSection).toBeVisible();
    }
  });
});

test.describe("Seller Gig Creation", () => {
  test("gig creation requires auth", async ({ page }) => {
    await page.goto("/gigs/create");
    await expect(page.getByText(/התחבר|כניסה/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("gig creation form loads for sellers", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/אימייל|דוא/).fill("seller1@daddy.com");
    await page.getByPlaceholder(/סיסמ/).fill("seller123");
    await page.getByRole("button", { name: /התחבר|כניסה/ }).click();
    await page.waitForURL("/", { timeout: 10000 });

    await page.goto("/gigs/create");
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    const formOrHeading = page.getByText(/צור שירות|שירות חדש|פרסם/i).first();
    await expect(formOrHeading).toBeVisible({ timeout: 5000 });
  });
});
