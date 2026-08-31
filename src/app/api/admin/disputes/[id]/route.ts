import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { ADMIN_DISPUTE_ACTIONS } from "@/lib/disputes";

const resolveSchema = z.object({
  action: z.enum(ADMIN_DISPUTE_ACTIONS),
  note: z.string().max(2000).optional(),
  splitBuyerAmount: z.number().optional(),
}).strict();

/** Records a staff decision on a dispute (release / refund / split / close). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await validateBody(request, resolveSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/admin/disputes/${id}`, {
    method: "PATCH",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}
