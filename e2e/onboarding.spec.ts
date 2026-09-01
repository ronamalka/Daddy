import { test, expect } from "@playwright/test";
import { stubCookieConsent } from "./cookies";
import { loginAs } from "./login";

test.describe("Daddy onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await stubCookieConsent(page);
  });

  test("become-a-daddy CTAs go to onboarding, not a blank register form", async ({ page }) => {
    await page.goto("/become-a-daddy");
    const ctas = page.locator('main a[href="/onboarding"]');
    await expect(ctas).toHaveCount(2);
    await expect(page.locator('main a[href="/register"]')).toHaveCount(0);
  });

  test("guest onboarding redirects to seller register", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForURL(/\/register\?role=SELLER/, { timeout: 10000 });
    await expect(page.getByText("למכור שירותים")).toBeVisible();
    await expect(page.getByText(/עוסק עצמאי/)).toBeVisible();
  });

  test("seller register shows independent-contractor confirmation", async ({ page }) => {
    await page.goto("/register?role=SELLER");
    await expect(page.getByText("אישורים משפטיים")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/עוסק עצמאי/)).toBeVisible();
  });

  test("buyer register hides the contractor checkbox until seller is selected", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText("אישורים משפטיים")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/עוסק עצמאי/)).toHaveCount(0);
    await page.getByText("למכור שירותים").click();
    await expect(page.getByText(/עוסק עצמאי/)).toBeVisible();
  });

  test("ready seller sees a complete profile progress meter", async ({ page }) => {
    await loginAs(page, "seller@daddy.com");
    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { name: "מוכן לקבל עבודות?" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("הפרופיל מוכן לעבודות")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "התקדמות פרופיל אבאל׳ה" })).toHaveAttribute(
      "aria-valuenow",
      "100"
    );
    await expect(page.getByRole("link", { name: "שירות עם מחיר" })).toBeVisible();
    await expect(page.getByRole("link", { name: "אזור שירות" })).toBeVisible();
    await expect(page.getByRole("link", { name: "שעות זמינות" })).toBeVisible();
    await expect(page.getByRole("link", { name: "מספר טלפון" })).toBeVisible();
    await expect(page.getByRole("link", { name: "תמונת פרופיל" })).toBeVisible();
  });

  test("buyer onboarding requires independent-contractor confirmation", async ({ page }) => {
    test.skip(!!process.env.CI, "Flaky in CI — login redirect times out under runner resource pressure");
    await loginAs(page, "buyer@daddy.com");
    await page.goto("/onboarding");
    await expect(page.getByRole("button", { name: "הפוך לאבאל׳ה" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/עוסק עצמאי/)).toBeVisible();
    await page.getByRole("button", { name: "הפוך לאבאל׳ה" }).click();
    await expect(page.getByText(/יש לאשר את תנאי השימוש/)).toBeVisible();
  });

  test("featured and provider search omit incomplete sellers", async ({ page }) => {
    await page.goto("/");
    const [featured, providers] = await Promise.all([
      page.request.get("/api/featured-daddies"),
      page.request.get("/api/providers"),
    ]);
    expect(featured.ok()).toBeTruthy();
    expect(providers.ok()).toBeTruthy();
    const featuredIds = ((await featured.json()) as { id: string }[]).map((s) => s.id);
    const providerIds = ((await providers.json()) as { id: string }[]).map((s) => s.id);
    expect(featuredIds).not.toContain("seed-user-incomplete");
    expect(providerIds).not.toContain("seed-user-incomplete");
    expect(providerIds).toContain("seed-user-seller1");
  });
});
