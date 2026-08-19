import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, GIGS_SERVICE } from "@/lib/gateway";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/orders", { user });
  return NextResponse.json(data, { status });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gigId, tier } = await request.json();

  const { data: gig, status: gigStatus } = await proxyRequest(GIGS_SERVICE, `/gigs/${gigId}`);
  if (gigStatus !== 200) {
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
