import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, REQUESTS_SERVICE, ORDERS_SERVICE, CHAT_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { validateAcceptQuote } from "@/lib/accept-quote";
import { parseRequiredVisitSlot } from "@/lib/seller-slot";

const acceptQuoteSchema = z.object({
  responseId: z.string().min(1).max(50),
}).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await validateBody(request, acceptQuoteSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(REQUESTS_SERVICE, `/service-requests/${id}`, { user });

  if (status !== 200 || !data?.request) {
    return NextResponse.json(data ?? { error: "הבקשה לא נמצאה" }, { status: status === 200 ? 404 : status });
  }

  const serviceRequest = data.request as {
    id: string;
    buyerId: string;
    status: string;
    title: string;
    serviceSlug: string | null;
    slotStart?: string | null;
    slotEnd?: string | null;
    responses: {
      id: string;
      requestId: string;
      sellerId: string;
      proposedPrice: number | null;
      message: string;
    }[];
  };

  const quote = serviceRequest.responses.find((r) => r.id === result.data.responseId) ?? null;
  const check = validateAcceptQuote({
    actorId: user.id,
    actorRole: user.role,
    request: serviceRequest,
    response: quote,
  });

  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const parsedSlot = parseRequiredVisitSlot(serviceRequest.slotStart, serviceRequest.slotEnd);
  if ("error" in parsedSlot) {
    return NextResponse.json({ error: parsedSlot.error }, { status: parsedSlot.status });
  }

  const { data: order, status: orderStatus } = await proxyRequest(ORDERS_SERVICE, "/orders", {
    method: "POST",
    body: {
      jobType: "LOCAL_REQUEST",
      sellerId: quote!.sellerId,
      price: quote!.proposedPrice,
      title: serviceRequest.title,
      requestId: serviceRequest.id,
      serviceSlug: serviceRequest.serviceSlug,
      slotStart: parsedSlot.slot.start.toISOString(),
      slotEnd: parsedSlot.slot.end.toISOString(),
    },
    user,
  });

  if (orderStatus === 409) {
    return NextResponse.json({ error: "החלון תפוס אצל האבא, בחר הצעה אחרת או עדכן מועד" }, { status: 409 });
  }

  if (orderStatus >= 400 || !order?.id) {
    return NextResponse.json(order ?? { error: "לא הצלחנו ליצור הזמנה" }, { status: orderStatus >= 400 ? orderStatus : 502 });
  }

  const { data: accepted, status: acceptStatus } = await proxyRequest(
    REQUESTS_SERVICE,
    `/service-requests/${id}/accept`,
    {
      method: "POST",
      body: { responseId: result.data.responseId, orderId: order.id },
      user,
    }
  );

  if (acceptStatus >= 400) {
    await proxyRequest(ORDERS_SERVICE, `/orders/${order.id}`, {
      method: "PATCH",
      body: { status: "CANCELLED" },
      user,
    });
    return NextResponse.json(accepted ?? { error: "לא הצלחנו לקבל את ההצעה" }, { status: acceptStatus });
  }

  await proxyRequest(CHAT_SERVICE, "/messages", {
    method: "POST",
    body: {
      content: `קיבלתי את ההצעה ב-₪${quote!.proposedPrice}. חלון הביקור נשמר.`,
      orderId: order.id,
      receiverId: quote!.sellerId,
    },
    user,
  });

  return NextResponse.json({ order, request: accepted?.request ?? accepted }, { status: 201 });
}
