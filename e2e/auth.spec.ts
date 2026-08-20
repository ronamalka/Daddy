import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  test("register page loads and shows form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText("צור חשבון חדש")).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder("ישראל ישראלי")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
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
    await page.getByPlaceholder("לפחות 8 תווים, אות גדולה, ספרה ותו מיוחד").fill("Test@1234!");

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
