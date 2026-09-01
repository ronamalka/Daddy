import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, REQUESTS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { detectBot } from "@/lib/bot-detection";
import { isTwoHourLocalWindow, parseSlotIso } from "@/lib/availability";
import { notifyNearbySellers } from "@/lib/nearby-request";

/** Loads a public display name for a user, or a Hebrew fallback. */
async function loadBuyer(id: string): Promise<{ id: string; name: string }> {
  const { data } = await proxyRequest(USERS_SERVICE, `/sellers/${id}`);
  if (data?.id && typeof data.name === "string") {
    return { id: data.id, name: data.name };
  }
  return { id, name: "משתמש" };
}

/** Adds a buyer name to each listed request so the seller UI can render it. */
async function withBuyerNames(rows: Array<{ buyerId: string }>) {
  const ids = [...new Set(rows.map((row) => row.buyerId))];
  const people = await Promise.all(ids.map((id) => loadBuyer(id)));
  const map = Object.fromEntries(people.map((person) => [person.id, person]));
  return rows.map((row) => ({
    ...row,
    buyer: map[row.buyerId] || { id: row.buyerId, name: "משתמש" },
  }));
}

/** Returns service requests the signed-in user is allowed to see. */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams.toString();
  const path = params ? `/service-requests?${params}` : "/service-requests";
  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(REQUESTS_SERVICE, path, { user });
  if (!Array.isArray(data)) {
    if (status >= 500 || !data) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data, { status });
  }
  return NextResponse.json(await withBuyerNames(data), { status });
}

/** Creates a service request after bot, CAPTCHA, and visit-window checks. */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const botCheck = detectBot({
    honeypot: body._hp_field,
    formLoadedAt: body._formLoadedAt,
    headers: request.headers,
  });

  if (botCheck.isBot) {
    console.warn(`[bot-detection] Service request blocked: ${botCheck.reason}`);
    return NextResponse.json(
      { error: "הבקשה נחסמה. נסה שוב." },
      { status: 400 }
    );
  }

  if (body.turnstileToken) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
    const valid = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!valid) {
      return NextResponse.json(
        { error: "אימות CAPTCHA נכשל. נסה שוב." },
        { status: 400 }
      );
    }
  } else if (process.env.TURNSTILE_SECRET_KEY) {
    return NextResponse.json(
      { error: "אימות CAPTCHA חסר." },
      { status: 400 }
    );
  }

  const { turnstileToken: _t, _hp_field: _h, _formLoadedAt: _f, ...cleanBody } = body;

  const slot = parseSlotIso(String(cleanBody.slotStart ?? ""), String(cleanBody.slotEnd ?? ""));
  if (!slot || !isTwoHourLocalWindow(slot.start, slot.end)) {
    return NextResponse.json(
      { error: "יש לבחור חלון ביקור של שעתיים" },
      { status: 400 }
    );
  }
  if (slot.start.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "חלון הביקור חייב להיות בעתיד" },
      { status: 400 }
    );
  }

  cleanBody.slotStart = slot.start.toISOString();
  cleanBody.slotEnd = slot.end.toISOString();
  cleanBody.unlisted = cleanBody.unlisted === true;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(REQUESTS_SERVICE, "/service-requests", {
    method: "POST",
    body: cleanBody,
    user,
  });
  if (!data) {
    return NextResponse.json(
      { error: "שגיאה בשליחת הבקשה" },
      { status: status >= 400 ? status : 502 }
    );
  }
  if (status < 400) {
    await notifyNearbySellers(user, data);
  }
  return NextResponse.json(data, { status });
}
