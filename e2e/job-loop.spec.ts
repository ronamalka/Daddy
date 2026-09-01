import { test, expect, type Page } from "@playwright/test";
import { loginAs, openAuthedPage } from "./login";

const BOT_WAIT_MS = 3500;
const QUOTE_PRICE = "250";
const REVIEW_COMMENT = "המדף יושב ישר אחרי הביקור — בדיקת לולאת העבודה";

test.describe("Real job loop", () => {
  test.describe.configure({ timeout: 120_000 });

  test("buyer request, seller quote, accept, start, deliver, complete, 1–10 review", async ({ browser }) => {
    const title = `הרכבת מדף E2E ${Date.now()}`;
    const buyer = await openAuthedPage(browser, "buyer@daddy.com");
    const seller = await openAuthedPage(browser, "seller@daddy.com");

    try {
      await buyer.page.goto("/requests/create");
      await expect(buyer.page.getByRole("heading", { name: "פרסם בקשת שירות" })).toBeVisible({
        timeout: 10000,
      });
      const openedAt = Date.now();

      await buyer.page.getByPlaceholder("לדוגמה: צריך עזרה בהרכבת ארון מאיקאה").fill(title);
      await buyer.page
        .getByPlaceholder("ספר בפירוט מה צריך לעשות ואיפה")
        .fill("מדף כבד בסלון, צריך קידוח בקיר בטון ופלס.");
      await buyer.page.locator('input[type="date"]').fill(futureVisitDate());
      await buyer.page
        .locator("select")
        .filter({ has: buyer.page.locator('option[value="1080"]') })
        .selectOption("1080");
      await buyer.page
        .locator("select")
        .filter({ has: buyer.page.locator('option[value="furniture-assembly"]') })
        .selectOption("furniture-assembly");
      await pickTelAvivCity(buyer.page);
      await waitForBotWindow(openedAt);

      const publish = buyer.page.getByRole("button", { name: /פרסם בקשה/ });
      await expect(publish).toBeEnabled();
      await publish.click();
      await buyer.page.waitForURL(
        (url) => /\/requests\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/create"),
        { timeout: 15000 }
      );
      await expect(buyer.page.getByRole("heading", { name: title })).toBeVisible({ timeout: 10000 });
      await expect(buyer.page.getByText("פתוח").first()).toBeVisible();

      const requestUrl = buyer.page.url();
      await seller.page.goto(requestUrl);
      await expect(seller.page.getByRole("heading", { name: title })).toBeVisible({ timeout: 10000 });
      await expect(seller.page.getByRole("heading", { name: "הגש הצעה" })).toBeVisible();
      await seller.page
        .getByPlaceholder("תאר את הניסיון שלך בתחום")
        .fill("יש לי מקדחה, פלס, וזמן בחלון שבחרת.");
      await seller.page.getByPlaceholder("אופציונלי").fill(QUOTE_PRICE);
      await seller.page.getByRole("button", { name: "שלח הצעה" }).click();
      await expect(seller.page.getByText("יופי! ההצעה בדרך")).toBeVisible({ timeout: 10000 });

      await buyer.page.reload();
      const acceptQuote = buyer.page.getByRole("button", { name: /קבלו את ההצעה של יוסי הגולדן ב-₪250/ });
      await expect(acceptQuote).toBeVisible({ timeout: 10000 });
      await acceptQuote.click();
      await buyer.page.waitForURL(/\/orders\/[^/]+$/, { timeout: 15000 });
      await expect(buyer.page.getByRole("heading", { name: title })).toBeVisible();
      await expect(buyer.page.getByText("ממתין").first()).toBeVisible();
      await expect(buyer.page.getByText(/ביקור:/)).toBeVisible();

      const orderUrl = buyer.page.url();
      await seller.page.goto(orderUrl);
      await expect(seller.page.getByRole("heading", { name: title })).toBeVisible({ timeout: 10000 });
      await seller.page.getByRole("button", { name: "קבל הזמנה" }).click();
      await expect(seller.page.getByText("בעבודה").first()).toBeVisible({ timeout: 10000 });
      await seller.page.getByRole("button", { name: "סמן כנמסר" }).click();
      await expect(seller.page.getByText("נמסר").first()).toBeVisible({ timeout: 10000 });

      await buyer.page.reload();
      await expect(buyer.page.getByRole("button", { name: "אשר קבלה" })).toBeVisible({ timeout: 10000 });
      await buyer.page.getByRole("button", { name: "אשר קבלה" }).click();
      await expect(buyer.page.getByRole("button", { name: "כתוב חוות דעת" })).toBeVisible({ timeout: 10000 });
      await buyer.page.getByRole("button", { name: "כתוב חוות דעת" }).click();
      const reviewOpenedAt = Date.now();
      await expect(buyer.page.getByText("לחץ על הציון המתאים בכל קריטריון (1-10)")).toBeVisible();
      await waitForBotWindow(reviewOpenedAt);
      await fillTenPointReview(buyer.page, REVIEW_COMMENT);
      await expect(buyer.page.getByText(REVIEW_COMMENT)).toBeVisible({ timeout: 10000 });
      await expect(buyer.page.getByText("9/10").first()).toBeVisible();

      await buyer.page.goto("/sellers/seed-user-seller1");
      await expect(buyer.page.getByRole("button", { name: /חוות דעת/ })).toBeVisible({ timeout: 10000 });
      await expect(buyer.page.getByText(REVIEW_COMMENT)).toBeVisible();
    } finally {
      await buyer.context.close();
      await seller.context.close();
    }
  });

  test("buyer books a priced service with a visit slot from the seller profile", async ({ page }) => {
    // Catalog unification (#94) made the seller price list the instant-book path.
    // /gigs/:id still exists for packages, but this is the live book-with-slot loop.
    await loginAs(page, "buyer@daddy.com");
    await page.goto("/sellers/seed-user-seller1");
    await expect(page.getByRole("heading", { name: "יוסי הגולדן", exact: true })).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: /מחירון/ }).click();
    await expect(page.getByText("בחרו חלון ביקור של שעתיים")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /\d{2}:\d{2}/ }).first().click();
    await page.getByRole("button", { name: /הזמן ב-₪/ }).first().click();
    await page.waitForURL(/\/orders\/[^/]+$/, { timeout: 15000 });
    await expect(page.getByText("ממתין").first()).toBeVisible();
    await expect(page.getByText(/ביקור:/)).toBeVisible();
  });
});

/** YYYY-MM-DD at least 10 days ahead, Sunday–Thursday in Jerusalem (seller hours). */
function futureVisitDate(minDays = 10): string {
  const extra = Math.floor(Math.random() * 4);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  for (let add = minDays + extra; add < minDays + extra + 8; add++) {
    const date = new Date(Date.now() + add * 86_400_000);
    const parts = Object.fromEntries(
      fmt.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
    );
    const weekday = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.weekday ?? ""];
    if (weekday !== undefined && weekday <= 4) {
      return `${parts.year}-${parts.month}-${parts.day}`;
    }
  }
  throw new Error("No Sunday–Thursday visit date in range");
}

/** Picks Tel Aviv district then the first matching city in the location picker. */
async function pickTelAvivCity(page: Page) {
  await expect(page.getByText("אזור")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "תל אביב", exact: true }).click();
  const search = page.getByPlaceholder("חפש עיר...");
  await expect(search).toBeVisible();
  await search.fill("תל אביב");
  const city = page.locator("div.max-h-48 button").first();
  await expect(city).toBeVisible({ timeout: 15000 });
  await city.click();
}

/** Waits out the bot-detection minimum if the form was opened too recently. */
async function waitForBotWindow(openedAt: number) {
  const remaining = BOT_WAIT_MS - (Date.now() - openedAt);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

/** Fills the four 1–10 criteria, a comment, and submits. */
async function fillTenPointReview(page: Page, comment: string) {
  for (const label of ["איכות", "יחס", "זמנים", "מחיר"]) {
    await page.getByRole("radio", { name: `${label}: 9 מתוך 10` }).click();
  }
  await page.getByPlaceholder("ספר על החוויה שלך").fill(comment);
  await page.getByRole("button", { name: "שלח חוות דעת" }).click();
}
