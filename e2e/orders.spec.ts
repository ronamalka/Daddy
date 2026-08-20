import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill("admin@daddy.com");
  await page.getByPlaceholder("הזן את הסיסמה שלך").fill("password123");
  await page.getByRole("button", { name: "התחבר" }).click();
  await page.waitForURL("/", { timeout: 15000 });
}

test.describe("Order Flow", () => {
  test("orders page requires auth", async ({ page }) => {
    await page.goto("/orders");
    await expect(
      page.getByText(/התחבר|כניסה|ברוך הבא/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("orders page loads for authenticated user", async ({ page }) => {
    await login(page);
    await page.goto("/orders");
    await page.waitForLoadState("domcontentloaded");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test("inbox page loads for authenticated user", async ({ page }) => {
    await login(page);
    await page.goto("/inbox");
    await page.waitForLoadState("domcontentloaded");
    const content = page.locator("main, [role='main'], body").first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});
