import type { Page } from "@playwright/test";

/** Skip the cookie dialog in tests that need to click the page. */
export async function stubCookieConsent(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "abale_cookie_consent_v1",
      JSON.stringify({
        choice: "rejected",
        analytics: false,
        marketing: false,
        ts: Date.now(),
        version: 1,
      })
    );
  });
}
