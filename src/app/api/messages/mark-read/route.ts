import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, CHAT_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { markReadSchema } from "@/lib/message-validation";

/** Marks messages from another user as read. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, markReadSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(CHAT_SERVICE, "/messages/mark-read", {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}
