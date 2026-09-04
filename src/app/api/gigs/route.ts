import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import { createGigSchema } from "@/lib/gig-create";
import { resolveAllowedGigCategory } from "@/lib/gig-category";
import { validateBody } from "@/lib/validate";

/** Returns gigs with seller details. Can filter by district query param. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get("district");
  const requestedLimit = parseInt(searchParams.get("limit") || "20", 10);
  if (district) {
    searchParams.set("limit", String(requestedLimit * 3));
  }
  const params = searchParams.toString();
  const path = params ? `/gigs?${params}` : "/gigs";
  const { data, status } = await proxyRequest(GIGS_SERVICE, path);

  if (status !== 200 || !data?.gigs) {
    return NextResponse.json(data ?? { gigs: [], total: 0, hasMore: false }, { status });
  }

  const sellerIds = [...new Set(data.gigs.map((g: { sellerId: string }) => g.sellerId))] as string[];

  const sellerMap: Record<string, { id: string; name: string; avatar: string | null; serviceAreas?: { districtName: string; cityName: string | null }[]; acceptingJobs?: boolean }> = {};
  await Promise.all(
    sellerIds.map(async (id) => {
      const { data: seller } = await proxyRequest(USERS_SERVICE, `/sellers/${id}`);
      if (seller) {
        sellerMap[id] = {
          id: seller.id,
          name: seller.name,
          avatar: seller.avatar,
          serviceAreas: seller.serviceAreas,
          acceptingJobs: seller.acceptingJobs !== false,
        };
      }
    })
  );

  let enriched = data.gigs.map((gig: { sellerId: string }) => ({
    ...gig,
    seller: sellerMap[gig.sellerId] || { id: gig.sellerId, name: "משתמש", avatar: null },
  })).filter((gig: { seller: { acceptingJobs?: boolean } }) => gig.seller.acceptingJobs !== false);

  if (district) {
    enriched = enriched.filter((gig: { seller: { serviceAreas?: { districtName: string }[] } }) =>
      gig.seller.serviceAreas?.some((a: { districtName: string }) => a.districtName === district)
    );
  }

  const wasFiltered = district || enriched.length !== data.gigs.length;
  const sliced = wasFiltered ? enriched.slice(0, requestedLimit) : enriched;
  const filteredHasMore = wasFiltered ? enriched.length > requestedLimit || data.hasMore : data.hasMore;

  return NextResponse.json({ gigs: sliced, total: wasFiltered ? enriched.length : data.total, hasMore: filteredHasMore });
}

/** Creates a new gig. Only sellers may call this. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, createGigSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const allowed = await resolveAllowedGigCategory(user, result.data.categoryId);
  if ("error" in allowed) {
    return NextResponse.json({ error: allowed.error }, { status: allowed.status });
  }

  const { data, status } = await proxyRequest(GIGS_SERVICE, "/gigs", {
    method: "POST",
    body: { ...result.data, categoryId: allowed.slug },
    user,
  });
  return NextResponse.json(data, { status });
}
