import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const createOrderSchema = z.object({
  gigId: z.string().uuid(),
  tier: z.string().min(1).max(50),
}).strict();

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/orders", { user });

  if (status !== 200 || !Array.isArray(data)) {
    return NextResponse.json(data, { status });
  }

  const gigIds = [...new Set(data.map((o: { gigId: string }) => o.gigId))] as string[];
  const userIds = [...new Set(data.flatMap((o: { buyerId: string; sellerId: string }) => [o.buyerId, o.sellerId]))] as string[];

  const gigMap: Record<string, { id: string; title: string; image: string | null }> = {};
  const userMap: Record<string, { id: string; name: string; avatar: string | null }> = {};

  await Promise.all([
    ...gigIds.map(async (id) => {
      const { data: gig } = await proxyRequest(GIGS_SERVICE, `/gigs/${id}`);
      if (gig) {
        gigMap[id] = { id: gig.id, title: gig.title, image: gig.image };
      }
    }),
    ...userIds.map(async (id) => {
      const { data: u } = await proxyRequest(USERS_SERVICE, `/sellers/${id}`);
      if (u) {
        userMap[id] = { id: u.id, name: u.name, avatar: u.avatar };
      }
    }),
  ]);

  const enriched = data.map((order: { gigId: string; buyerId: string; sellerId: string }) => ({
    ...order,
    gig: gigMap[order.gigId] || { id: order.gigId, title: "שירות", image: null },
    buyer: userMap[order.buyerId] || { id: order.buyerId, name: "משתמש", avatar: null },
    seller: userMap[order.sellerId] || { id: order.sellerId, name: "משתמש", avatar: null },
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, createOrderSchema);
  if ("error" in result) return result.error;

  const { gigId, tier } = result.data;

  const { data: gig, status: gigStatus } = await proxyRequest(GIGS_SERVICE, `/gigs/${gigId}`);
  if (gigStatus !== 200 || !gig) {
    return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  }

  const pricingTier = gig.tiers?.find((t: { tier: string }) => t.tier === tier);
  if (!pricingTier) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/orders", {
    method: "POST",
    body: {
      gigId,
      sellerId: gig.sellerId,
      tier,
      price: pricingTier.price,
      deliveryDays: pricingTier.deliveryDays,
    },
    user,
  });
  return NextResponse.json(data, { status });
}
