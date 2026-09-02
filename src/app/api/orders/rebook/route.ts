import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { parseRequiredVisitSlot, sellerAvailabilityError } from "@/lib/seller-slot";

const rebookSchema = z.object({
  sellerId: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  laborPrice: z.number().positive().max(100000),
  materialsEstimate: z.number().min(0).max(100000).nullable().optional(),
  buyerSuppliesMaterials: z.boolean().optional(),
  slotStart: z.string().min(10).max(40),
  slotEnd: z.string().min(10).max(40),
  previousOrderId: z.string().max(50).optional(),
}).strict();

/** Loads a seller's weekly hours and time-off from the users service. */
async function loadAvailability(sellerId: string) {
  const { data } = await proxyRequest(USERS_SERVICE, `/availability/${sellerId}`);
  return data;
}

/** Creates a rebook order (a repeat local-request order with a previous seller). */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, rebookSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { sellerId, title, description, laborPrice, materialsEstimate, buyerSuppliesMaterials, slotStart, slotEnd, previousOrderId } = result.data;

  if (sellerId === user.id) {
    return NextResponse.json({ error: "לא ניתן להזמין את עצמך" }, { status: 400 });
  }

  const parsedSlot = parseRequiredVisitSlot(slotStart, slotEnd);
  if ("error" in parsedSlot) {
    return NextResponse.json({ error: parsedSlot.error }, { status: parsedSlot.status });
  }

  const availability = await loadAvailability(sellerId);
  const blocked = sellerAvailabilityError(availability, parsedSlot.slot, { requireAccepting: true });
  if (blocked) {
    return NextResponse.json({ error: blocked.error }, { status: blocked.status });
  }

  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/orders/rebook", {
    method: "POST",
    body: {
      sellerId,
      title,
      description,
      laborPrice,
      materialsEstimate,
      buyerSuppliesMaterials,
      slotStart: parsedSlot.slot.start.toISOString(),
      slotEnd: parsedSlot.slot.end.toISOString(),
      previousOrderId,
    },
    user,
  });

  if (status === 409) {
    return NextResponse.json({ error: "החלון תפוס, בחר זמן אחר" }, { status: 409 });
  }

  return NextResponse.json(data, { status });
}
