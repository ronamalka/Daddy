import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, CHAT_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { orderMessageSchema, attachSender } from "@/lib/message-validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, orderMessageSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string; image?: string | null };
  const { data: order, status: orderStatus } = await proxyRequest(ORDERS_SERVICE, `/orders/${id}`, { user });

  if (orderStatus !== 200 || !order) {
    return NextResponse.json(order ?? { error: "Order not found" }, { status: orderStatus });
  }

  if (order.buyerId !== user.id && order.sellerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const receiverId = user.id === order.buyerId ? order.sellerId : order.buyerId;
  const { data, status } = await proxyRequest(CHAT_SERVICE, "/messages", {
    method: "POST",
    body: { content: result.data.content, orderId: id, receiverId },
    user,
  });

  if (status >= 400 || !data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json(data ?? { error: "Failed to send message" }, { status });
  }

  return NextResponse.json(attachSender(data as Record<string, unknown>, user), { status });
}
