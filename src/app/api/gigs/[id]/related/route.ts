import { NextResponse } from "next/server";
import { proxyRequest, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, status } = await proxyRequest(GIGS_SERVICE, `/gigs/${id}/related`);

  if (status !== 200 || !Array.isArray(data)) {
    return NextResponse.json(Array.isArray(data) ? data : [], { status: status === 200 ? 200 : status });
  }

  const sellerIds = [...new Set(data.map((gig: { sellerId?: string }) => gig.sellerId).filter(Boolean))] as string[];
  const sellerMap: Record<string, { id: string; name: string; avatar: string | null }> = {};

  await Promise.all(
    sellerIds.map(async (sellerId) => {
      const { data: seller } = await proxyRequest(USERS_SERVICE, `/sellers/${sellerId}`);
      if (seller?.id) {
        sellerMap[sellerId] = { id: seller.id, name: seller.name, avatar: seller.avatar };
      }
    })
  );

  const enriched = data.map((gig: { sellerId?: string }) => ({
    ...gig,
    seller: (gig.sellerId && sellerMap[gig.sellerId]) || { id: gig.sellerId || "", name: "משתמש", avatar: null },
  }));

  return NextResponse.json(enriched);
}
