import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, GIGS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const respondSchema = z.object({ response: z.string().min(1).max(2000) }).strict();

/** Posts a seller reply on a review. Requires a signed-in user. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, respondSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(GIGS_SERVICE, `/reviews/${id}/respond`, {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}
