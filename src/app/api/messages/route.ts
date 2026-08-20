import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const messageSchema = z.object({
  orderId: z.string().uuid(),
  content: z.string().min(1).max(5000),
}).strict();

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, messageSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/messages", {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  const path = params ? `/messages?${params}` : "/messages";

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, path, { user });
  return NextResponse.json(data, { status });
}
