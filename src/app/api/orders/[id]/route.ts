import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const updateOrderSchema = z.object({
  status: z.enum(["accepted", "rejected", "in_progress", "delivered", "completed", "cancelled"]),
}).strict();

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

  const [gigRes, buyerRes, sellerRes, reviewRes] = await Promise.all([
    proxyRequest(GIGS_SERVICE, `/gigs/${data.gigId}`),
    proxyRequest(USERS_SERVICE, `/sellers/${data.buyerId}`),
    proxyRequest(USERS_SERVICE, `/sellers/${data.sellerId}`),
    proxyRequest(GIGS_SERVICE, `/reviews/by-order/${id}`),
  ]);

  const gig = gigRes.data;
  const enrichedMessages = data.messages?.map((msg: { senderId: string }) => ({
    ...msg,
    sender: msg.senderId === data.buyerId
      ? { id: data.buyerId, name: buyerRes.data?.name || "משתמש", avatar: buyerRes.data?.avatar || null }
      : { id: data.sellerId, name: sellerRes.data?.name || "משתמש", avatar: sellerRes.data?.avatar || null },
  })) || [];

  const enriched = {
    ...data,
    gig: gig ? {
      id: gig.id,
      title: gig.title,
      image: gig.image,
      tiers: gig.tiers || [],
      requirements: gig.requirements || [],
    } : { id: data.gigId, title: "שירות", image: null, tiers: [], requirements: [] },
    buyer: { id: data.buyerId, name: buyerRes.data?.name || "משתמש", avatar: buyerRes.data?.avatar || null },
    seller: { id: data.sellerId, name: sellerRes.data?.name || "משתמש", avatar: sellerRes.data?.avatar || null },
    messages: enrichedMessages,
    review: reviewRes.status === 200 ? reviewRes.data : null,
  };

  return NextResponse.json(enriched);
}

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
