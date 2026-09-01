import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, GIGS_SERVICE, USERS_SERVICE, CHAT_SERVICE } from "@/lib/gateway";
import { loadOrderVisit, visitVisibleToSeller } from "@/lib/order-visit";
import { validateBody } from "@/lib/validate";
import { updateOrderSchema } from "@/lib/order-update";

/** Returns one order with gig, buyer, seller, messages, review, and seller-only visit address. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/orders/${id}`, { user });

  if (status !== 200 || !data) {
    return NextResponse.json(data ?? { error: "Order not found" }, { status });
  }

  const [gigRes, buyerRes, sellerRes, reviewRes, messagesRes, visit, paymentRes] = await Promise.all([
    data.gigId ? proxyRequest(GIGS_SERVICE, `/gigs/${data.gigId}`) : Promise.resolve({ data: null, status: 404 }),
    proxyRequest(USERS_SERVICE, `/sellers/${data.buyerId}`),
    proxyRequest(USERS_SERVICE, `/sellers/${data.sellerId}`),
    proxyRequest(GIGS_SERVICE, `/reviews/by-order/${id}`),
    proxyRequest(CHAT_SERVICE, `/messages?orderId=${id}`, { user }),
    loadOrderVisit(
      user.id === data.sellerId || user.role === "ADMIN" ? data.requestId : null,
      user
    ),
    proxyRequest(ORDERS_SERVICE, `/orders/${id}/payment`, { user }),
  ]);

  const gig = gigRes.data;
  const rawMessages = Array.isArray(messagesRes.data) ? messagesRes.data : [];
  const enrichedMessages = rawMessages.map((msg: { senderId: string }) => ({
    ...msg,
    sender: msg.senderId === data.buyerId
      ? { id: data.buyerId, name: buyerRes.data?.name || "משתמש", avatar: buyerRes.data?.avatar || null }
      : { id: data.sellerId, name: sellerRes.data?.name || "משתמש", avatar: sellerRes.data?.avatar || null },
  }));

  const enriched = {
    ...data,
    gig: gig ? {
      id: gig.id,
      title: gig.title,
      image: gig.image,
      tiers: gig.tiers || [],
      requirements: gig.requirements || [],
    } : { id: data.gigId || "", title: data.title || "עבודת שטח", image: null, tiers: [], requirements: [] },
    buyer: { id: data.buyerId, name: buyerRes.data?.name || "משתמש", avatar: buyerRes.data?.avatar || null },
    seller: { id: data.sellerId, name: sellerRes.data?.name || "משתמש", avatar: sellerRes.data?.avatar || null },
    messages: enrichedMessages,
    review: reviewRes.status === 200 ? reviewRes.data : null,
    visit: visitVisibleToSeller(visit, user, data.sellerId),
    payment: paymentRes.status === 200 && paymentRes.data?.id ? paymentRes.data : null,
  };

  return NextResponse.json(enriched);
}

/** Updates an order status (accept, deliver with photos, complete, cancel, or request a revision). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, updateOrderSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/orders/${id}`, {
    method: "PATCH",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}
