import { NextResponse } from "next/server";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  const path = params ? `/locations?${params}` : "/locations";
  const { data, status } = await proxyRequest(USERS_SERVICE, path);
  return NextResponse.json(data, { status });
}
