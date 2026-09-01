import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { parseRequiredVisitSlot, sellerAvailabilityError } from "@/lib/seller-slot";

const createGigOrderSchema = z.object({
  gigId: z.string().min(1).max(50),
  tier: z.string().min(1).max(50),
  slotStart: z.string().min(10).max(40),
  slotEnd: z.string().min(10).max(40),
}).strict();

const createLocalOrderSchema = z.object({
  jobType: z.literal("LOCAL_REQUEST"),
  sellerId: z.string().min(1).max(50),
  price: z.number().positive().max(100000),
  laborPrice: z.number().positive().max(100000).optional(),
  materialsEstimate: z.number().min(0).max(100000).nullable().optional(),
  buyerSuppliesMaterials: z.boolean().optional(),
  title: z.string().min(1).max(200),
  serviceSlug: z.string().max(100).optional(),
  requestId: z.string().min(1).max(50).optional(),
  slotStart: z.string().min(10).max(40),
  slotEnd: z.string().min(10).max(40),
}).strict();

const createOrderSchema = z.union([createGigOrderSchema, createLocalOrderSchema]);

type OrderRow = {
  gigId?: string | null;
  title?: string | null;
  buyerId: string;
  sellerId: string;
};

/** Builds a small gig object when the real listing is missing. */
function gigFallback(order: OrderRow) {
  return {
    id: order.gigId || "",
    title: order.title || "עבודת שטח",
    image: null as string | null,
  };
}

/** Returns the signed-in user's orders with gig, buyer, and seller names filled in. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/orders", { user });

  if (status !== 200 || !Array.isArray(data)) {
    return NextResponse.json(data ?? { error: "Failed to load orders" }, { status });
  }

  const gigIds = [...new Set(
    data.map((o: OrderRow) => o.gigId).filter((id): id is string => Boolean(id))
  )];
  const userIds = [...new Set(data.flatMap((o: OrderRow) => [o.buyerId, o.sellerId]))];

  const gigMap: Record<string, { id: string; title: string; image: string | null }> = {};
  const userMap: Record<string, { id: string; name: string; avatar: string | null }> = {};

  await Promise.all([
    ...gigIds.map(async (id) => {
      const { data: gig } = await proxyRequest(GIGS_SERVICE, `/gigs/${id}`);
      if (gig?.id && typeof gig.title === "string") {
        gigMap[id] = { id: gig.id, title: gig.title, image: gig.image };
      }
    }),
    ...userIds.map(async (id) => {
      const { data: u } = await proxyRequest(USERS_SERVICE, `/sellers/${id}`);
      if (u?.id && typeof u.name === "string") {
        userMap[id] = { id: u.id, name: u.name, avatar: u.avatar ?? null };
      }
    }),
  ]);

  const enriched = data.map((order: OrderRow) => ({
    ...order,
    mySide: order.sellerId === user.id ? "SELLER" : "BUYER",
    gig: (order.gigId && gigMap[order.gigId]) || gigFallback(order),
    buyer: userMap[order.buyerId] || { id: order.buyerId, name: "משתמש", avatar: null },
    seller: userMap[order.sellerId] || { id: order.sellerId, name: "משתמש", avatar: null },
  }));

  return NextResponse.json(enriched);
}

/** Loads a seller's weekly hours and time-off from the users service. */
async function loadAvailability(sellerId: string) {
  const { data } = await proxyRequest(USERS_SERVICE, `/availability/${sellerId}`);
  return data;
}

/** Creates an order from a gig or a local request, after checking the visit slot is free. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, createOrderSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const parsedSlot = parseRequiredVisitSlot(result.data.slotStart, result.data.slotEnd);
  if ("error" in parsedSlot) {
    return NextResponse.json({ error: parsedSlot.error }, { status: parsedSlot.status });
  }

  if ("jobType" in result.data) {
    const { sellerId, price, title, serviceSlug, requestId, laborPrice, materialsEstimate, buyerSuppliesMaterials } = result.data;
    if (sellerId === user.id) {
      return NextResponse.json({ error: "לא ניתן להזמין את עצמך" }, { status: 400 });
    }

    const availability = await loadAvailability(sellerId);
    const blocked = sellerAvailabilityError(availability, parsedSlot.slot, { requireAccepting: true });
    if (blocked) {
      return NextResponse.json({ error: blocked.error }, { status: blocked.status });
    }

    const { data, status } = await proxyRequest(ORDERS_SERVICE, "/orders", {
      method: "POST",
      body: {
        jobType: "LOCAL_REQUEST",
        sellerId,
        price,
        laborPrice,
        materialsEstimate,
        buyerSuppliesMaterials,
        title,
        serviceSlug,
        requestId,
        slotStart: parsedSlot.slot.start.toISOString(),
        slotEnd: parsedSlot.slot.end.toISOString(),
      },
      user,
    });

    if (status === 409) {
      return NextResponse.json({ error: "החלון תפוס, בחר זמן אחר" }, { status: 409 });
    }

    return NextResponse.json(data, { status });
  }

  const { gigId, tier } = result.data;

  const { data: gig, status: gigStatus } = await proxyRequest(GIGS_SERVICE, `/gigs/${gigId}`);
  if (gigStatus !== 200 || !gig) {
    return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  }

  const pricingTier = gig.tiers?.find((t: { tier: string }) => t.tier === tier);
  if (!pricingTier) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const availability = await loadAvailability(gig.sellerId);
  const blocked = sellerAvailabilityError(availability, parsedSlot.slot, { requireAccepting: true });
  if (blocked) {
    return NextResponse.json({ error: blocked.error }, { status: blocked.status });
  }

  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/orders", {
    method: "POST",
    body: {
      gigId,
      sellerId: gig.sellerId,
      tier,
      price: pricingTier.price,
      slotStart: parsedSlot.slot.start.toISOString(),
      slotEnd: parsedSlot.slot.end.toISOString(),
    },
    user,
  });

  if (status === 409) {
    return NextResponse.json(
      { error: "החלון תפוס, בחר זמן אחר" },
      { status: 409 }
    );
  }

  return NextResponse.json(data, { status });
}
