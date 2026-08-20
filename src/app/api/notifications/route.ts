import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data: orders, status } = await proxyRequest(ORDERS_SERVICE, "/orders", { user });

  if (status !== 200 || !Array.isArray(orders)) {
    return NextResponse.json([]);
  }

  const notifications: {
    id: string;
    type: string;
    title: string;
    message: string;
    orderId: string;
    createdAt: string;
    read: boolean;
  }[] = [];

  const isSeller = user.role === "SELLER";

  for (const order of orders) {
    if (isSeller && order.status === "PENDING") {
      notifications.push({
        id: `new-order-${order.id}`,
        type: "NEW_ORDER",
        title: "הזמנה חדשה!",
        message: `קיבלת הזמנה חדשה בסך ₪${order.price}`,
        orderId: order.id,
        createdAt: order.createdAt,
        read: false,
      });
    }

    if (isSeller && order.status === "REVISION") {
      notifications.push({
        id: `revision-${order.id}`,
        type: "REVISION_REQUESTED",
        title: "בקשת תיקון",
        message: "הקונה ביקש תיקון להזמנה",
        orderId: order.id,
        createdAt: order.updatedAt || order.createdAt,
        read: false,
      });
    }

    if (!isSeller && order.status === "DELIVERED") {
      notifications.push({
        id: `delivered-${order.id}`,
        type: "ORDER_DELIVERED",
        title: "ההזמנה נמסרה!",
        message: "בעל המקצוע סיים את העבודה. בדוק ואשר.",
        orderId: order.id,
        createdAt: order.updatedAt || order.createdAt,
        read: false,
      });
    }

    if (!isSeller && order.status === "IN_PROGRESS") {
      notifications.push({
        id: `accepted-${order.id}`,
        type: "ORDER_ACCEPTED",
        title: "ההזמנה אושרה",
        message: "בעל המקצוע קיבל את ההזמנה והתחיל לעבוד",
        orderId: order.id,
        createdAt: order.updatedAt || order.createdAt,
        read: false,
      });
    }
  }

  const gigIds = [...new Set(orders.map((o: { gigId: string }) => o.gigId))];
  const gigMap: Record<string, string> = {};
  await Promise.all(
    gigIds.map(async (id: string) => {
      const { data: gig } = await proxyRequest(GIGS_SERVICE, `/gigs/${id}`);
      if (gig) gigMap[id] = gig.title;
    })
  );

  for (const n of notifications) {
    const order = orders.find((o: { id: string }) => o.id === n.orderId);
    if (order && gigMap[order.gigId]) {
      n.message += ` — ${gigMap[order.gigId]}`;
    }
  }

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(notifications.slice(0, 20));
}
