import { NextResponse } from "next/server";
import { proxyRequest, REQUESTS_SERVICE } from "@/lib/gateway";
import { mapRequestTeasers } from "@/lib/request-teaser";

const TEASER_CACHE = "public, max-age=30, s-maxage=60, stale-while-revalidate=300";

/** Public, cacheable list of recent OPEN requests (city + service + age only). */
export async function GET() {
  const { data } = await proxyRequest(REQUESTS_SERVICE, "/service-requests/teaser");
  return NextResponse.json(mapRequestTeasers(data), {
    headers: { "Cache-Control": TEASER_CACHE },
  });
}
