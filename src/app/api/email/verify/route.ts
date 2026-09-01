import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

/** Verifies an email address using the token from the verification link. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const { data, status } = await proxyRequest(USERS_SERVICE, `/email/verify?token=${encodeURIComponent(token)}`, {
    method: "GET",
  });

  return NextResponse.json(data, { status });
}
