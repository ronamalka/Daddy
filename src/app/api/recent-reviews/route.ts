import { NextResponse } from "next/server";
import { fetchRecentReviews } from "@/lib/homepage-data";

/** Returns recent reviews with buyer and seller names filled in. */
export async function GET() {
  const reviews = await fetchRecentReviews();
  return NextResponse.json(reviews);
}
