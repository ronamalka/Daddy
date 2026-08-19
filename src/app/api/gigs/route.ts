import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  const path = params ? `/gigs?${params}` : "/gigs";
  const { data, status } = await proxyRequest(GIGS_SERVICE, path);

  if (status !== 200 || !data.gigs) {
    return NextResponse.json(data, { status });
  }

  const sellerIds = [...new Set(data.gigs.map((g: { sellerId: string }) => g.sellerId))] as string[];

  const sellerMap: Record<string, { id: string; name: string; avatar: string | null; serviceAreas?: { districtName: string; cityName: string | null }[] }> = {};
  await Promise.all(
    sellerIds.map(async (id) => {
      const { data: seller } = await proxyRequest(USERS_SERVICE, `/sellers/${id}`);
      if (seller) {
        sellerMap[id] = {
          id: seller.id,
          name: seller.name,
          avatar: seller.avatar,
          serviceAreas: seller.serviceAreas,
        };
      }
    })
  );

  let enriched = data.gigs.map((gig: { sellerId: string }) => ({
    ...gig,
    seller: sellerMap[gig.sellerId] || { id: gig.sellerId, name: "משתמש", avatar: null },
  }));

  const district = searchParams.get("district");
  if (district) {
    enriched = enriched.filter((gig: { seller: { serviceAreas?: { districtName: string }[] } }) =>
      gig.seller.serviceAreas?.some((a: { districtName: string }) => a.districtName === district)
    );
  }

  const filteredTotal = district ? enriched.length : data.total;
  const filteredHasMore = district ? false : data.hasMore;

  return NextResponse.json({ gigs: enriched, total: filteredTotal, hasMore: filteredHasMore });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(GIGS_SERVICE, "/gigs", {
    method: "POST",
    body,
    user,
  });
  return NextResponse.json(data, { status });
}
