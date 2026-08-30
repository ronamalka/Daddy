import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, CHAT_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { directMessageSchema } from "@/lib/message-validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, directMessageSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(CHAT_SERVICE, "/messages", {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data ?? { error: "Failed to send message" }, { status });
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
  const { data, status } = await proxyRequest(CHAT_SERVICE, path, { user });
  return NextResponse.json(data, { status });
}
