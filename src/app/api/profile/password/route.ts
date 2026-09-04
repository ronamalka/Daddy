import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { passwordSchema, checkBreachedPassword } from "@/lib/password-policy";
import { logSecurityEvent, extractClientInfo } from "@/lib/security-logger";
import { revokeSessionsForUser } from "@/lib/session-revoke";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
}).strict();

/** Changes the signed-in user's password after checking the current one and leak lists. */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, changePasswordSchema);
  if ("error" in result) return result.error;

  const breached = await checkBreachedPassword(result.data.newPassword);
  if (breached) {
    return NextResponse.json(
      { error: "הסיסמה הזו נמצאה בדליפות נתונים ידועות. בחר סיסמה אחרת." },
      { status: 400 }
    );
  }

  const { data, status } = await proxyRequest(USERS_SERVICE, "/profile/password", {
    method: "PUT",
    body: result.data,
    user: session.user as { id: string; email: string; name: string; role: string },
  });

  if (status >= 200 && status < 300) {
    logSecurityEvent("password_changed", {
      userId: session.user.id,
      email: session.user.email,
      outcome: "success",
      ...extractClientInfo(request),
    });

    revokeSessionsForUser(session.user.id).catch(() => {});
  }

  return NextResponse.json(data ?? { error: "Service unavailable" }, { status });
}
