import { NextResponse } from "next/server";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

/** Returns cities and districts. Query params are passed through to the users service. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  const path = params ? `/locations?${params}` : "/locations";
  const { data, status } = await proxyRequest(USERS_SERVICE, path);
  return NextResponse.json(data, { status });
}
