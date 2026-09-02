import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { isAllowedPhotoUrl } from "@/lib/disputes";

const MAX_WARRANTY_PHOTOS = 5;

const createWarrantySchema = z.object({
  description: z.string().trim().min(1, "יש לתאר את הבעיה").max(2000),
  photos: z
    .array(
      z.string().min(1).refine(isAllowedPhotoUrl, "כתובת תמונה לא תקינה")
    )
    .max(MAX_WARRANTY_PHOTOS)
    .optional()
    .default([]),
}).strict();

/** Creates a warranty claim on a completed order. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, createWarrantySchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/orders/${id}/warranty-claim`, {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}

/** Lists warranty claims on this order. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/orders/${id}/warranty-claim`, {
    user,
  });
  return NextResponse.json(data, { status });
}
