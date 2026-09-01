import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const proposeMaterialsSchema = z.object({
  action: z.literal("propose").optional(),
  materialsEstimate: z.number().positive().max(100000),
}).strict();

const ackMaterialsSchema = z.object({
  action: z.literal("ack"),
}).strict();

const materialsSchema = z.union([ackMaterialsSchema, proposeMaterialsSchema]);

/** Seller proposes a materials estimate, or buyer acknowledges it, before work starts. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, materialsSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/orders/${id}/materials`, {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}
