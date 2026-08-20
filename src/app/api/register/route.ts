import { NextResponse } from "next/server";
import { z } from "zod";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { passwordSchema, checkBreachedPassword } from "@/lib/password-policy";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  password: passwordSchema,
  role: z.enum(["BUYER", "SELLER"]),
}).strict();

export async function POST(request: Request) {
  const result = await validateBody(request, registerSchema);
  if ("error" in result) return result.error;

  const breached = await checkBreachedPassword(result.data.password);
  if (breached) {
    return NextResponse.json(
      { error: "הסיסמה הזו נמצאה בדליפות נתונים ידועות. בחר סיסמה אחרת." },
      { status: 400 }
    );
  }

  const { data, status } = await proxyRequest(USERS_SERVICE, "/register", {
    method: "POST",
    body: result.data,
  });
  return NextResponse.json(data ?? { error: "Service unavailable" }, { status });
}
