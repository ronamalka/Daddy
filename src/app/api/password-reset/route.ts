import { NextResponse } from "next/server";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (!action || !["request", "validate", "reset"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const body = await request.json();
  const { data, status } = await proxyRequest(USERS_SERVICE, `/password-reset/${action}`, {
    method: "POST",
    body,
  });
  return NextResponse.json(data, { status });
}
