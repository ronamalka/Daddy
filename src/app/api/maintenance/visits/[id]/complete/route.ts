import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const completeVisitSchema = z.object({
  report: z.string().min(1).max(5000),
  photos: z.array(z.string().url()).max(20).optional(),
}).strict();

/** Marks a maintenance visit as completed. Only the assigned seller may call this. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, completeVisitSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/maintenance/visits/${id}/complete`, {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}
