import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { orderMessageSchema, attachSender } from "@/lib/message-validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, orderMessageSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string; image?: string | null };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/orders/${id}/messages`, {
    method: "POST",
    body: result.data,
    user,
  });

  if (status >= 400 || !data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json(data ?? { error: "Failed to send message" }, { status });
  }

  return NextResponse.json(attachSender(data as Record<string, unknown>, user), { status });
}
