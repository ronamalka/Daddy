import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, USERS_SERVICE, GIGS_SERVICE } from "@/lib/gateway";

/** Returns a list of service providers. Query params are passed through to the users service. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams.toString();
  const path = params ? `/providers?${params}` : "/providers";
  const { data, status } = await proxyRequest(USERS_SERVICE, path);

  if (!Array.isArray(data) || status !== 200) {
    return NextResponse.json(data, { status });
  }

  type ProviderRow = {
    id: string;
    startingPrice?: number | null;
    [key: string]: unknown;
  };

  const enriched = await Promise.all(
    data.map(async (provider: ProviderRow) => {
      const { data: reviewData } = await proxyRequest(GIGS_SERVICE, `/reviews/by-seller/${provider.id}`).catch(
        () => ({ data: null, status: 502 })
      );
      return {
        ...provider,
        reviewCount: reviewData?.reviewCount || 0,
        avgRating: reviewData?.avgRating || 0,
      };
    })
  );

  if (request.nextUrl.searchParams.get("sortBy") === "rating") {
    enriched.sort(
      (a, b) =>
        (b.avgRating || 0) - (a.avgRating || 0) ||
        (a.startingPrice ?? Number.POSITIVE_INFINITY) - (b.startingPrice ?? Number.POSITIVE_INFINITY)
    );
  }

  return NextResponse.json(enriched);
}
