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

  const enriched = await Promise.all(
    data.map(async (provider: { id: string; [key: string]: unknown }) => {
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

  return NextResponse.json(enriched);
}
