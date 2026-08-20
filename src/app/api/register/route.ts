import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { passwordSchema, checkBreachedPassword } from "@/lib/password-policy";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { detectBot } from "@/lib/bot-detection";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  password: passwordSchema,
  role: z.enum(["BUYER", "SELLER"]),
  turnstileToken: z.string().optional(),
  _hp_field: z.string().max(0).optional(),
  _formLoadedAt: z.number().optional(),
}).strict();

export async function POST(request: NextRequest) {
  const result = await validateBody(request, registerSchema);
  if ("error" in result) return result.error;

  const botCheck = detectBot({
    honeypot: result.data._hp_field,
    formLoadedAt: result.data._formLoadedAt,
    headers: request.headers,
  });

  if (botCheck.isBot) {
    console.warn(`[bot-detection] Registration blocked: ${botCheck.reason}`);
    return NextResponse.json(
      { error: "הבקשה נחסמה. נסה שוב." },
      { status: 400 }
    );
  }

  if (result.data.turnstileToken) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
    const valid = await verifyTurnstileToken(result.data.turnstileToken, ip);
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

  const breached = await checkBreachedPassword(result.data.password);
  if (breached) {
    return NextResponse.json(
      { error: "הסיסמה הזו נמצאה בדליפות נתונים ידועות. בחר סיסמה אחרת." },
      { status: 400 }
    );
  }

  const { turnstileToken: _t, _hp_field: _h, _formLoadedAt: _f, ...cleanData } = result.data;

  const { data, status } = await proxyRequest(USERS_SERVICE, "/register", {
    method: "POST",
    body: cleanData,
  });
  return NextResponse.json(data ?? { error: "Service unavailable" }, { status });
}
