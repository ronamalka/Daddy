import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

/** Returns a list of service providers. Query params are passed through to the users service. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  const path = params ? `/providers?${params}` : "/providers";
  const { data, status } = await proxyRequest(USERS_SERVICE, path);
  return NextResponse.json(data, { status });
}
