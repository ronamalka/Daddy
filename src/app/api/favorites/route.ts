import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, GIGS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const favoriteSchema = z.object({
  gigId: z.string().min(1).max(100),
}).strict();

/** Returns the signed-in user's favorite gigs. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(GIGS_SERVICE, "/favorites", { user });
  return NextResponse.json(data, { status });
}

/** Adds or removes a gig from the signed-in user's favorites. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, favoriteSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(GIGS_SERVICE, "/favorites", {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}
