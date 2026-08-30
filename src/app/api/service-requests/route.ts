import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, REQUESTS_SERVICE } from "@/lib/gateway";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { detectBot } from "@/lib/bot-detection";
import { isTwoHourLocalWindow, parseSlotIso } from "@/lib/availability";

/** Returns open service requests. Query params are passed through. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  const path = params ? `/service-requests?${params}` : "/service-requests";
  const { data, status } = await proxyRequest(REQUESTS_SERVICE, path);
  if (status >= 500 || !data) {
    return NextResponse.json([], { status: 200 });
  }
  return NextResponse.json(data, { status });
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

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(REQUESTS_SERVICE, "/service-requests", {
    method: "POST",
    body: cleanBody,
    user,
  });
  return NextResponse.json(data, { status });
}
