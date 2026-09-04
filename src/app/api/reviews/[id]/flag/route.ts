import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, GIGS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const flagSchema = z.object({ reason: z.string().min(1).max(500) }).strict();

/** Flags a review as inappropriate. Requires a signed-in user. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, flagSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(GIGS_SERVICE, `/reviews/${id}/flag`, {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}
