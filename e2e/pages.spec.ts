import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/אבאל׳ה|daddy/i);
    await expect(page.getByText("צריך עזרה בהרכבת ארון גדול")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("בקשה פרטית — לא אמורה להופיע באתר")).toHaveCount(0);
    await expect(page.getByText("קניתי ארון PAX")).toHaveCount(0);
  });

  test("how it works page loads", async ({ page }) => {
    await page.goto("/how-it-works");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
  });

  test("how-it-works FAQ links a dispute to the orders page", async ({ page }) => {
    await page.goto("/how-it-works");
    await page.getByRole("button", { name: "מה אם לא מרוצה מהשירות?" }).click();
    const link = page.getByRole("link", { name: "פתחו מחלוקת מדף ההזמנה" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/orders");
  });

  test("how-it-works FAQ states the 24-hour cancel window, not 14-day cooling-off", async ({ page }) => {
    await page.goto("/how-it-works");
    await page.getByRole("button", { name: "אפשר לבטל?" }).click();
    await expect(page.getByText(/24 שעות לפני חלון הביקור/)).toBeVisible();
    await expect(page.getByText(/אינו 14 ימי ביטול/)).toBeVisible();
  });

  test("terms page states the platform is an intermediary", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "תנאי שימוש" })).toBeVisible();
    await expect(page.getByText(/תיווך בלבד/)).toBeVisible();
    await expect(page.getByText(/24 שעות לפני תחילת חלון הביקור/)).toBeVisible();
    await expect(page.getByText(/ולא עסקת מכר מרחוק רגילה עם 14 ימי ביטול/)).toBeVisible();
  });

  test("cookie banner can be rejected", async ({ page }) => {
    await page.goto("/");
    const dialog = page.getByRole("dialog", { name: "עוגיות והסכמה" });
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.getByRole("button", { name: "דחייה" }).click();
    await expect(dialog).toBeHidden();
  });

  test("guidelines page loads", async ({ page }) => {
    await page.goto("/guidelines");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
    await expect(page.getByRole("heading", { name: "כללי קהילה" })).toBeVisible();
  });

  test("become a daddy page loads", async ({ page }) => {
    await page.goto("/become-a-daddy");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
    await expect(page.getByRole("link", { name: /הירשם/ }).first()).toHaveAttribute("href", "/onboarding");
  });

  test("onboarding sends guests to seller register", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForURL(/\/register\?role=SELLER/, { timeout: 10000 });
    await expect(page.getByText(/למכור שירותים/)).toBeVisible();
  });

  test("favorites page requires auth", async ({ page }) => {
    await page.goto("/favorites");
    await expect(page.getByText(/התחבר|כניסה/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("open requests page shows a public teaser for guests", async ({ page }) => {
    await page.goto("/requests");
    await expect(page.getByRole("heading", { name: "בקשות פתוחות עכשיו" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("צריך עזרה בהרכבת ארון גדול")).toBeVisible();
    await expect(page.getByRole("link", { name: /התחברו כדי להגיב/ }).first()).toBeVisible();
    await expect(page.getByText("בקשה פרטית — לא אמורה להופיע באתר")).toHaveCount(0);
    await expect(page.getByText("קניתי ארון PAX")).toHaveCount(0);
  });

  test("profile page requires auth", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByText(/התחבר|כניסה/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("seller profile page loads for valid seller", async ({ page }) => {
    await page.goto("/sellers/seed-seller-1");
    await page.waitForLoadState("domcontentloaded");
  });

  test("404 for non-existent seller", async ({ page }) => {
    await page.goto("/sellers/nonexistent-user-id");
    await page.waitForLoadState("domcontentloaded");
  });

  test("request creation page loads", async ({ page }) => {
    await page.goto("/requests/create");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
  });

  test("forgot password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("navbar contains expected links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "עיון" }).first()).toBeVisible();
  });

  test("mobile viewport renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible();
  });

  test("mobile hamburger menu covers the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const cookieDialog = page.getByRole("dialog", { name: "עוגיות והסכמה" });
    await cookieDialog.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    if (await cookieDialog.isVisible().catch(() => false)) {
      await cookieDialog.getByRole("button", { name: "דחייה" }).click();
      await expect(cookieDialog).toBeHidden();
    }

    await page.getByRole("button", { name: "פתח תפריט", exact: true }).click();
    const menu = page.getByRole("dialog", { name: "תפריט ניווט" });
    await expect(menu).toBeVisible();

    const box = await menu.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeLessThanOrEqual(2);
    expect(box!.height).toBeGreaterThan(700);

    await expect(menu.getByRole("link", { name: "עיון" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "התחברות" })).toBeVisible();

    const trappedInNav = await menu.evaluate((el) => !!el.closest("nav"));
    expect(trappedInNav).toBe(false);

    await page.getByRole("button", { name: "סגור תפריט" }).click();
    await expect(menu).toBeHidden();
  });
});
