import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

/** Submits an identity photo URL for admin review. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.photoUrl || typeof body.photoUrl !== "string") {
    return NextResponse.json({ error: "יש לצרף קישור לתמונה" }, { status: 400 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(USERS_SERVICE, "/verify/identity/upload", {
    method: "POST",
    body: { photoUrl: body.photoUrl },
    user,
  });
  return NextResponse.json(data, { status });
}
