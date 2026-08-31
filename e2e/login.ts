import type { Page } from "@playwright/test";
import { stubCookieConsent } from "./cookies";

/** Signs in with a seeded account and waits until the home page loads. */
export async function loginAs(page: Page, email: string, password = "password123") {
  await stubCookieConsent(page);
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("הזן את הסיסמה שלך").fill(password);
  await page.getByRole("button", { name: "התחבר" }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });
}
