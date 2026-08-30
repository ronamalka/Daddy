import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, GIGS_SERVICE, USERS_SERVICE, CHAT_SERVICE } from "@/lib/gateway";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  read: boolean;
};

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const [{ data: orders, status: ordersStatus }, { data: conversations }] = await Promise.all([
    proxyRequest(ORDERS_SERVICE, "/orders", { user }),
    proxyRequest(CHAT_SERVICE, "/messages/conversations", { user }),
  ]);

  const notifications: NotificationItem[] = [];
  const isSeller = user.role === "SELLER";
  const orderList = ordersStatus === 200 && Array.isArray(orders) ? orders : [];

  for (const order of orderList) {
    if (isSeller && order.status === "PENDING") {
      notifications.push({
        id: `new-order-${order.id}`,
        type: "NEW_ORDER",
        title: "הזמנה חדשה!",
        message: `קיבלת הזמנה חדשה בסך ₪${order.price}`,
        href: `/orders/${order.id}`,
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
        href: `/orders/${order.id}`,
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
        href: `/orders/${order.id}`,
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
        href: `/orders/${order.id}`,
        createdAt: order.updatedAt || order.createdAt,
        read: false,
      });
    }
  }

  const gigIds = [...new Set(orderList.map((o: { gigId?: string | null }) => o.gigId).filter((id): id is string => Boolean(id)))];
  const gigMap: Record<string, string> = {};
  await Promise.all(
    gigIds.map(async (id: string) => {
      const { data: gig } = await proxyRequest(GIGS_SERVICE, `/gigs/${id}`);
      if (gig) gigMap[id] = gig.title;
    })
  );

  for (const n of notifications) {
    const orderId = n.href.startsWith("/orders/") ? n.href.slice("/orders/".length) : "";
    const order = orderList.find((o: { id: string; gigId?: string | null; title?: string | null }) => o.id === orderId);
    if (!order) continue;
    const label = (order.gigId && gigMap[order.gigId]) || order.title;
    if (label) n.message += ` — ${label}`;
  }

  if (Array.isArray(conversations)) {
    const unreadThreads = conversations.filter((row: { unreadCount?: number }) => (row.unreadCount || 0) > 0);
    await Promise.all(
      unreadThreads.map(async (row: {
        otherUserId: string;
        unreadCount: number;
        lastMessage?: { content?: string; createdAt?: string };
      }) => {
        const { data: person } = await proxyRequest(USERS_SERVICE, `/sellers/${row.otherUserId}`);
        const name = typeof person?.name === "string" ? person.name : "מישהו";
        const preview = (row.lastMessage?.content || "הודעה חדשה").slice(0, 80);
        const count = row.unreadCount;
        notifications.push({
          id: `message-${row.otherUserId}`,
          type: "NEW_MESSAGE",
          title: count > 1 ? `${count} הודעות חדשות מ${name}` : `הודעה חדשה מ${name}`,
          message: preview,
          href: `/inbox/${row.otherUserId}`,
          createdAt: row.lastMessage?.createdAt || new Date().toISOString(),
          read: false,
        });
      })
    );
  }

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(notifications.slice(0, 20));
}
