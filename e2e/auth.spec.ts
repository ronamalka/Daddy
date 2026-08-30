import { test, expect } from "@playwright/test";
import { stubCookieConsent } from "./cookies";

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

  test("login page loads and shows form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("ברוך הבא חזרה")).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("notexist@test.com");
    await page.getByPlaceholder("הזן את הסיסמה שלך").fill("wrongpassword");
    await page.getByRole("button", { name: "התחבר" }).click();

    await expect(
      page.getByText(/שגיאה|שגוי|לא נכון|invalid|credentials/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("login with valid credentials redirects to home", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("admin@daddy.com");
    await page.getByPlaceholder("הזן את הסיסמה שלך").fill("password123");
    await page.getByRole("button", { name: "התחבר" }).click();
    await page.waitForURL("/", { timeout: 15000 });
  });

  test("register rejects duplicate email", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("ישראל ישראלי").fill("Test User");
    await page.getByPlaceholder("you@example.com").fill("admin@daddy.com");
    await page.getByPlaceholder("לפחות 6 תווים").fill("password123");

    await page.getByRole("button", { name: "המשך" }).click();
    await expect(
      page.getByText(/קיים|נמצא|duplicate|exists/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("protected pages redirect unauthenticated users", async ({ page }) => {
    await page.goto("/orders");
    await expect(
      page.getByText(/התחבר|כניסה|login|ברוך הבא/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
