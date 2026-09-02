import { NextResponse } from "next/server";
import { fetchFeaturedDaddies } from "@/lib/homepage-data";

/** Returns up to six featured sellers with ratings and completed-order counts. */
export async function GET() {
  const daddies = await fetchFeaturedDaddies();
  return NextResponse.json(daddies);
}
