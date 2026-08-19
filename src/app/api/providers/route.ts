import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  const path = params ? `/providers?${params}` : "/providers";
  const { data, status } = await proxyRequest(USERS_SERVICE, path);
  return NextResponse.json(data, { status });
}
