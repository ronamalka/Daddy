import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE, ORDERS_SERVICE } from "@/lib/gateway";

/** Aggregate analytics from users + orders services. Admin only. */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const section = request.nextUrl.searchParams.get("section") || "overview";
  const days = request.nextUrl.searchParams.get("days") || "90";

  switch (section) {
    case "overview": {
      const [usersRes, ordersRes] = await Promise.all([
        proxyRequest(USERS_SERVICE, "/api/analytics/overview", { user }),
        proxyRequest(ORDERS_SERVICE, "/api/analytics/overview", { user }),
      ]);

      return NextResponse.json({
        users: usersRes.data ?? {},
        orders: ordersRes.data ?? {},
      });
    }

    case "timeseries": {
      const [signupsRes, ordersRes] = await Promise.all([
        proxyRequest(USERS_SERVICE, `/api/analytics/signups-timeseries?days=${days}`, { user }),
        proxyRequest(ORDERS_SERVICE, `/api/analytics/timeseries?days=${days}`, { user }),
      ]);

      return NextResponse.json({
        signups: signupsRes.data ?? { series: [] },
        orders: ordersRes.data ?? { series: [] },
      });
    }

    case "breakdowns": {
      const [byStatusRes, byRoleRes] = await Promise.all([
        proxyRequest(ORDERS_SERVICE, "/api/analytics/by-status", { user }),
        proxyRequest(USERS_SERVICE, "/api/analytics/overview", { user }),
      ]);

      return NextResponse.json({
        ordersByStatus: byStatusRes.data ?? {},
        usersByRole: byRoleRes.data?.byRole ?? {},
      });
    }

    case "revenue": {
      const [commissionRes, subscriptionRes, ltvOrdersRes, ltvUsersRes] = await Promise.all([
        proxyRequest(ORDERS_SERVICE, "/api/analytics/commission", { user }),
        proxyRequest(USERS_SERVICE, "/api/analytics/subscriptions", { user }),
        proxyRequest(ORDERS_SERVICE, "/api/analytics/ltv", { user }),
        proxyRequest(USERS_SERVICE, "/api/analytics/ltv", { user }),
      ]);

      return NextResponse.json({
        commission: commissionRes.data ?? {},
        subscriptions: subscriptionRes.data ?? {},
        ltv: {
          ...(ltvOrdersRes.data ?? {}),
          ...(ltvUsersRes.data ?? {}),
        },
      });
    }

    case "funnel": {
      const period = request.nextUrl.searchParams.get("period") || "30";
      const funnelRes = await proxyRequest(
        ORDERS_SERVICE,
        `/api/analytics/funnel?period=${period}`,
        { user },
      );
      return NextResponse.json(funnelRes.data ?? { steps: [] });
    }

    default:
      return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  }
}
