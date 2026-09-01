import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { passwordSchema, checkBreachedPassword } from "@/lib/password-policy";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { detectBot } from "@/lib/bot-detection";
import { enforceRateLimit } from "@/lib/rate-limit-redis";

const requestResetSchema = z.object({
  email: z.string().email().max(254),
  turnstileToken: z.string().optional(),
  _hp_field: z.string().max(0).optional(),
  _formLoadedAt: z.number().optional(),
}).strict();

const validateTokenSchema = z.object({
  token: z.string().min(1).max(500),
}).strict();

const resetPasswordSchema = z.object({
  token: z.string().min(1).max(500),
  password: passwordSchema,
}).strict();

/** Handles password reset: request a link, check a token, or set a new password (`action` query). */
export async function POST(request: NextRequest) {
  // Redis-based rate limit that works across all pods (10 attempts per 60s).
  const limited = await enforceRateLimit(request, "password-reset", 10, 60);
  if (limited) return limited;

  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "request") {
    const result = await validateBody(request, requestResetSchema);
    if ("error" in result) return result.error;

    const botCheck = detectBot({
      honeypot: result.data._hp_field,
      formLoadedAt: result.data._formLoadedAt,
      headers: request.headers,
    });

    if (botCheck.isBot) {
      console.warn(`[bot-detection] Password reset blocked: ${botCheck.reason}`);
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

    const { turnstileToken: _t, _hp_field: _h, _formLoadedAt: _f, ...cleanData } = result.data;

    const { data, status } = await proxyRequest(USERS_SERVICE, "/password-reset/request", {
      method: "POST",
      body: cleanData,
    });
    return NextResponse.json(data, { status });
  }

  if (action === "validate") {
    const result = await validateBody(request, validateTokenSchema);
    if ("error" in result) return result.error;
    const { data, status } = await proxyRequest(USERS_SERVICE, "/password-reset/validate", {
      method: "POST",
      body: result.data,
    });
    return NextResponse.json(data, { status });
  }

  if (action === "reset") {
    const result = await validateBody(request, resetPasswordSchema);
    if ("error" in result) return result.error;

    const breached = await checkBreachedPassword(result.data.password);
    if (breached) {
      return NextResponse.json(
        { error: "הסיסמה הזו נמצאה בדליפות נתונים ידועות. בחר סיסמה אחרת." },
        { status: 400 }
      );
    }

    const { data, status } = await proxyRequest(USERS_SERVICE, "/password-reset/reset", {
      method: "POST",
      body: result.data,
    });
    return NextResponse.json(data, { status });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
