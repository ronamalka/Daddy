import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, REQUESTS_SERVICE } from "@/lib/gateway";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  const path = params ? `/service-requests?${params}` : "/service-requests";
  const { data, status } = await proxyRequest(REQUESTS_SERVICE, path);
  if (status >= 500 || !data) {
    return NextResponse.json([], { status: 200 });
  }
  return NextResponse.json(data, { status });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(REQUESTS_SERVICE, "/service-requests", {
    method: "POST",
    body,
    user,
  });
  return NextResponse.json(data, { status });
}
