import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, GIGS_SERVICE } from "@/lib/gateway";

/** Checks whether the current user has favorited a specific seller. */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = request.nextUrl.searchParams.get("sellerId");
  if (!sellerId) {
    return NextResponse.json({ error: "sellerId required" }, { status: 400 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(GIGS_SERVICE, `/favorite-sellers/check?sellerId=${encodeURIComponent(sellerId)}`, { user });
  return NextResponse.json(data, { status });
}
