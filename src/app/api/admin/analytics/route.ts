import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, USERS_SERVICE, ORDERS_SERVICE, REQUESTS_SERVICE } from "@/lib/gateway";

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
      const funnelType = request.nextUrl.searchParams.get("type") || "buyer";
      if (funnelType === "seller") {
        const [usersCountsRes, requestsCountsRes, ordersCountsRes] = await Promise.all([
          proxyRequest(USERS_SERVICE, `/api/analytics/event-counts?period=${period}&names=signup_completed`, { user }),
          proxyRequest(REQUESTS_SERVICE, `/api/analytics/event-counts?period=${period}&names=quote.sent`, { user }),
          proxyRequest(ORDERS_SERVICE, `/api/analytics/event-counts?period=${period}&names=order.created,order.completed`, { user }),
        ]);
        const uc = usersCountsRes.data?.counts ?? {};
        const rc = requestsCountsRes.data?.counts ?? {};
        const oc = ordersCountsRes.data?.counts ?? {};
        return NextResponse.json({
          funnel: "seller",
          period: `${period}d`,
          steps: [
            { name: "signed_up", count: uc["signup_completed"] ?? 0 },
            { name: "sent_quote", count: rc["quote.sent"] ?? 0 },
            { name: "got_order", count: oc["order.created"] ?? 0 },
            { name: "completed_order", count: oc["order.completed"] ?? 0 },
          ],
        });
      }
      const [usersCountsRes, requestsCountsRes, ordersCountsRes] = await Promise.all([
        proxyRequest(USERS_SERVICE, `/api/analytics/event-counts?period=${period}&names=signup_completed`, { user }),
        proxyRequest(REQUESTS_SERVICE, `/api/analytics/event-counts?period=${period}&names=request.created,quote.accepted`, { user }),
        proxyRequest(ORDERS_SERVICE, `/api/analytics/event-counts?period=${period}&names=order.created,order.completed`, { user }),
      ]);
      const uc = usersCountsRes.data?.counts ?? {};
      const rc = requestsCountsRes.data?.counts ?? {};
      const oc = ordersCountsRes.data?.counts ?? {};
      return NextResponse.json({
        funnel: "buyer",
        period: `${period}d`,
        steps: [
          { name: "signed_up", count: uc["signup_completed"] ?? 0 },
          { name: "posted_request", count: rc["request.created"] ?? 0 },
          { name: "accepted_quote", count: rc["quote.accepted"] ?? 0 },
          { name: "order_created", count: oc["order.created"] ?? 0 },
          { name: "order_completed", count: oc["order.completed"] ?? 0 },
        ],
      });
    }

    default:
      return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  }
}
