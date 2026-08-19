import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, GIGS_SERVICE } from "@/lib/gateway";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };

  const [ordersRes, reviewsRes, favoritesRes] = await Promise.all([
    proxyRequest(ORDERS_SERVICE, "/orders/stats", { user }),
    proxyRequest(GIGS_SERVICE, `/gigs/reviews/by-seller/${user.id}`),
    proxyRequest(GIGS_SERVICE, `/gigs/favorites/count/${user.id}`),
  ]);

  const gigsCountRes = await proxyRequest(GIGS_SERVICE, `/gigs?sellerId=${user.id}`);
  const gigsCount = Array.isArray(gigsCountRes.data) ? gigsCountRes.data.length : 0;

  return NextResponse.json({
    totalOrders: ordersRes.data.totalOrders || 0,
    ordersBuyer: ordersRes.data.ordersBuyer || 0,
    ordersSeller: ordersRes.data.ordersSeller || 0,
    reviewsReceived: reviewsRes.data.reviewCount || 0,
    reviewsGiven: 0,
    avgRating: reviewsRes.data.avgRating || 0,
    gigsCount,
    favoritesCount: favoritesRes.data.favoritesCount || 0,
  });
}
