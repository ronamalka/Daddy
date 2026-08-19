import { NextResponse } from "next/server";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

export async function POST(request: Request) {
  const body = await request.json();
  const { data, status } = await proxyRequest(USERS_SERVICE, "/register", {
    method: "POST",
    body,
  });
  return NextResponse.json(data, { status });
}
