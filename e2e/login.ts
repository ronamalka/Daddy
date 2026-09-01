import type { Browser, Page } from "@playwright/test";
import { stubCookieConsent } from "./cookies";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

/** Signs in with a seeded account and waits until the home page loads. */
export async function loginAs(page: Page, email: string, password = "password123") {
  await stubCookieConsent(page);
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("הזן את הסיסמה שלך").fill(password);
  await page.getByRole("button", { name: "התחבר" }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });
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
