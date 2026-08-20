import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE, GIGS_SERVICE, ORDERS_SERVICE } from "@/lib/gateway";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };

  const [usersRes, gigsRes, ordersRes] = await Promise.all([
    proxyRequest(USERS_SERVICE, "/admin/stats", { user }),
    proxyRequest(GIGS_SERVICE, "/gigs/stats/counts"),
    proxyRequest(ORDERS_SERVICE, "/orders/stats/admin"),
  ]);

  return NextResponse.json({
    users: usersRes.data?.users || 0,
    gigs: gigsRes.data?.gigs || 0,
    orders: ordersRes.data?.orders || 0,
    revenue: ordersRes.data?.revenue || 0,
  });
}
