import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const preferencesUpdateSchema = z.object({
  notifyWhatsapp: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
});

/** Returns the signed-in user's notification preferences. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, status } = await proxyRequest(USERS_SERVICE, "/notifications/preferences", {
    user: session.user as { id: string; email: string; name: string; role: string },
  });
  return NextResponse.json(data, { status });
}

/** Updates the signed-in user's notification preferences. */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, preferencesUpdateSchema);
  if ("error" in result) return result.error;

  const { data, status } = await proxyRequest(USERS_SERVICE, "/notifications/preferences", {
    method: "PUT",
    body: result.data,
    user: session.user as { id: string; email: string; name: string; role: string },
  });
  return NextResponse.json(data, { status });
}
