import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  test("register page loads and shows form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /הרשמה|הצטרף/ })).toBeVisible();
    await expect(page.getByPlaceholder(/שם מלא|שם/)).toBeVisible();
    await expect(page.getByPlaceholder(/אימייל|דוא/)).toBeVisible();
    await expect(page.getByPlaceholder(/סיסמ/)).toBeVisible();
  });

  test("login page loads and shows form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /התחברות|כניסה/ })).toBeVisible();
    await expect(page.getByPlaceholder(/אימייל|דוא/)).toBeVisible();
    await expect(page.getByPlaceholder(/סיסמ/)).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/אימייל|דוא/).fill("notexist@test.com");
    await page.getByPlaceholder(/סיסמ/).fill("wrongpassword");
    await page.getByRole("button", { name: /התחבר|כניסה/ }).click();
    await expect(page.getByText(/שגיאה|שגוי|לא נכון|invalid/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("login with valid credentials redirects to home", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/אימייל|דוא/).fill("admin@daddy.com");
    await page.getByPlaceholder(/סיסמ/).fill("admin123");
    await page.getByRole("button", { name: /התחבר|כניסה/ }).click();
    await page.waitForURL("/", { timeout: 10000 });
    await expect(page.getByText(/אבאל׳ה/)).toBeVisible();
  });

  test("logout returns to login", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/אימייל|דוא/).fill("admin@daddy.com");
    await page.getByPlaceholder(/סיסמ/).fill("admin123");
    await page.getByRole("button", { name: /התחבר|כניסה/ }).click();
    await page.waitForURL("/", { timeout: 10000 });

    const logoutButton = page.getByText(/התנתק/);
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
    } else {
      const avatarButton = page.locator("nav button").last();
      await avatarButton.click();
      await page.getByText(/התנתק/).click();
    }

    await page.waitForURL(/\/(login)?$/, { timeout: 10000 });
  });

  test("register rejects duplicate email", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder(/שם מלא|שם/).fill("Test User");
    await page.getByPlaceholder(/אימייל|דוא/).fill("admin@daddy.com");
    await page.getByPlaceholder(/סיסמ/).first().fill("password123");

    const confirmField = page.getByPlaceholder(/אימות|אשר/).first();
    if (await confirmField.isVisible().catch(() => false)) {
      await confirmField.fill("password123");
    }

    await page.getByRole("button", { name: /הרשמ|הצטרף|המשך/ }).first().click();
    await expect(page.getByText(/קיים|נמצא|duplicate|exists/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("protected pages redirect unauthenticated users", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByText(/התחבר|כניסה|login/i).first()).toBeVisible({ timeout: 5000 });
  });
});
