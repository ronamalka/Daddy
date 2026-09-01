import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";

interface OrderData {
  id: string;
  jobType: string;
  gigId: string | null;
  sellerId: string;
  buyerId: string;
  tier: string | null;
  price: number;
  status: string;
  title: string | null;
  serviceSlug?: string | null;
}

/** Returns data needed to rebook a completed order with current pricing. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };

  const { data: order, status } = await proxyRequest(ORDERS_SERVICE, `/orders/${id}`, { user });
  if (status !== 200 || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const orderData = order as OrderData;

  if (orderData.status !== "COMPLETED") {
    return NextResponse.json({ error: "ניתן להזמין שוב רק הזמנות שהושלמו" }, { status: 400 });
  }

  if (orderData.buyerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sellerRes = await proxyRequest(USERS_SERVICE, `/sellers/${orderData.sellerId}`);
  const seller = sellerRes.data;

  if (orderData.jobType === "GIG" && orderData.gigId) {
    const gigRes = await proxyRequest(GIGS_SERVICE, `/gigs/${orderData.gigId}`);
    const gig = gigRes.data;

    return NextResponse.json({
      type: "gig",
      gigId: orderData.gigId,
      sellerId: orderData.sellerId,
      seller: seller ? { id: seller.id, name: seller.name, avatar: seller.avatar ?? null } : null,
      gig: gig ? {
        id: gig.id,
        title: gig.title,
        image: gig.image,
        tiers: gig.tiers ?? [],
      } : null,
      originalTier: orderData.tier,
    });
  }

  const servicePrices = seller?.servicePrices ?? [];
  const currentPrice = orderData.serviceSlug
    ? servicePrices.find((sp: { serviceSlug: string }) => sp.serviceSlug === orderData.serviceSlug)
    : null;

  return NextResponse.json({
    type: "local_request",
    sellerId: orderData.sellerId,
    seller: seller ? { id: seller.id, name: seller.name, avatar: seller.avatar ?? null } : null,
    serviceSlug: orderData.serviceSlug ?? null,
    title: orderData.title,
    currentPrice: currentPrice ?? null,
    originalPrice: orderData.price,
  });
}
