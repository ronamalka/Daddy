import { test, expect } from "@playwright/test";
import { stubCookieConsent } from "./cookies";
import { loginAs } from "./login";

test.describe("Auth Flow", () => {
  test.beforeEach(async ({ page }) => {
    await stubCookieConsent(page);
  });

  test("register requires legal consent checkboxes", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText("אישורים משפטיים")).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder("ישראל ישראלי").fill("ישראל ישראלי");
    await page.getByPlaceholder("you@example.com").fill("consent@example.com");
    await page.getByPlaceholder(/לפחות 8 תווים/).fill("Password1!");
    await page.getByRole("button", { name: "המשך" }).click();
    await expect(page.getByRole("heading", { name: "בוא נכיר" })).toBeVisible();
  });

  test("register Google requires legal consent", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "הרשמה עם Google" }).click();
    // Next.js also mounts `#__next-route-announcer__` with role="alert".
    await expect(
      page.getByRole("alert").filter({ hasText: /תנאי השימוש|גיל 18/ })
    ).toBeVisible({ timeout: 10000 });
  });

  test("login page offers Google sign-in", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "שוב פה? יופי, חיכינו לך" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: "המשך עם Google" })).toBeVisible();
  });

  test("login shows Hebrew when Google OAuth is denied", async ({ page }) => {
    await page.goto("/login?error=AccessDenied");
    await expect(page.getByRole("alert").filter({ hasText: /נדחתה/ })).toBeVisible({
      timeout: 10000,
    });
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("notexist@test.com");
    await page.getByPlaceholder("הזן את הסיסמה שלך").fill("wrongpassword");
    await page.getByRole("button", { name: "התחבר" }).click();

    await expect(page.getByRole("alert").filter({ hasText: /שגוי/ })).toBeVisible({
      timeout: 10000,
    });
  });

  test("login with valid credentials redirects to home", async ({ page }) => {
    await loginAs(page, "admin@daddy.com");
  });

  test("register rejects duplicate email", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("ישראל ישראלי").fill("Test User");
    await page.getByPlaceholder("you@example.com").fill("admin@daddy.com");
    await page.getByPlaceholder(/לפחות 8 תווים/).fill("Password1!");
    await page.getByRole("checkbox", { name: /תנאי השימוש/ }).check();
    await page.getByRole("checkbox", { name: /18/ }).check();
    await page.getByRole("button", { name: "המשך" }).click();
    await expect(page.getByRole("heading", { name: "איפה אתה פועל?" })).toBeVisible();
    await page.getByRole("button", { name: "דלג, אבחר אחר כך" }).click();
    await expect(page.getByText(/קיים|נמצא|duplicate|exists|already/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("protected pages redirect unauthenticated users", async ({ page }) => {
    await page.goto("/orders");
    await expect(
      page.getByText(/התחבר|כניסה|login|ברוך הבא/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
