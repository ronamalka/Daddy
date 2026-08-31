import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { DISPUTE_REASONS, MAX_DISPUTE_PHOTOS, MAX_DISPUTE_DESCRIPTION } from "@/lib/disputes";

const createDisputeSchema = z.object({
  reason: z.enum(DISPUTE_REASONS),
  description: z.string().trim().min(1).max(MAX_DISPUTE_DESCRIPTION),
  photos: z.array(z.string().min(1)).max(MAX_DISPUTE_PHOTOS).optional().default([]),
}).strict();

/** Opens a dispute on an in-progress or delivered order. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, createDisputeSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/orders/${id}/disputes`, {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}

/** Lists disputes on this order for a party or admin. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/orders/${id}/disputes`, { user });
  return NextResponse.json(data, { status });
}
