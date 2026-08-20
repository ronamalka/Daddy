import { NextResponse } from "next/server";
import { z } from "zod";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { passwordSchema, checkBreachedPassword } from "@/lib/password-policy";

const requestResetSchema = z.object({
  email: z.string().email().max(254),
}).strict();

const validateTokenSchema = z.object({
  token: z.string().min(1).max(500),
}).strict();

const resetPasswordSchema = z.object({
  token: z.string().min(1).max(500),
  password: passwordSchema,
}).strict();

export async function POST(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "request") {
    const result = await validateBody(request, requestResetSchema);
    if ("error" in result) return result.error;
    const { data, status } = await proxyRequest(USERS_SERVICE, "/password-reset/request", {
      method: "POST",
      body: result.data,
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
