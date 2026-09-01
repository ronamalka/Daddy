import type { Browser, Page } from "@playwright/test";
import { stubCookieConsent } from "./cookies";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

/** Signs in with a seeded account and waits until the home page loads. */
export async function loginAs(page: Page, email: string, password = "password123") {
  const loginTimeout = process.env.CI ? 45000 : 15000;
  await stubCookieConsent(page);
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("הזן את הסיסמה שלך").fill(password);
    await page.getByRole("button", { name: "התחבר" }).click();
    try {
      await page.waitForURL((url) => url.pathname === "/", { timeout: loginTimeout });
      return;
    } catch (error) {
      const blocked = await page.getByText(/Too many requests|יותר מדי/).isVisible().catch(() => false);
      if (!blocked || attempt === 2) throw error;
      await page.waitForTimeout(5000);
    }
  }
}

/** Opens a fresh browser context, signs in, and returns both so two users can act at once. */
export async function openAuthedPage(browser: Browser, email: string, password = "password123") {
  const context = await browser.newContext({
    locale: "he-IL",
    baseURL: BASE_URL,
  });
  const page = await context.newPage();
  await loginAs(page, email, password);
  return { context, page };
}
