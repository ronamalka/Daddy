import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { isTwoHourLocalWindow, parseSlotIso, slotFitsSchedule } from "@/lib/availability";

const createOrderSchema = z.object({
  gigId: z.string().min(1).max(50),
  tier: z.string().min(1).max(50),
  slotStart: z.string().min(10).max(40),
  slotEnd: z.string().min(10).max(40),
}).strict();

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/orders", { user });

  if (status !== 200 || !Array.isArray(data)) {
    return NextResponse.json(data ?? { error: "Failed to load orders" }, { status });
  }

  const gigIds = [...new Set(data.map((o: { gigId: string }) => o.gigId))] as string[];
  const userIds = [...new Set(data.flatMap((o: { buyerId: string; sellerId: string }) => [o.buyerId, o.sellerId]))] as string[];

  const gigMap: Record<string, { id: string; title: string; image: string | null }> = {};
  const userMap: Record<string, { id: string; name: string; avatar: string | null }> = {};

  await Promise.all([
    ...gigIds.map(async (id) => {
      const { data: gig } = await proxyRequest(GIGS_SERVICE, `/gigs/${id}`);
      if (gig?.id && typeof gig.title === "string") {
        gigMap[id] = { id: gig.id, title: gig.title, image: gig.image };
      }
    }),
    ...userIds.map(async (id) => {
      const { data: u } = await proxyRequest(USERS_SERVICE, `/sellers/${id}`);
      if (u?.id && typeof u.name === "string") {
        userMap[id] = { id: u.id, name: u.name, avatar: u.avatar ?? null };
      }
    }),
  ]);

  const enriched = data.map((order: { gigId: string; buyerId: string; sellerId: string }) => ({
    ...order,
    gig: gigMap[order.gigId] || { id: order.gigId, title: "שירות", image: null },
    buyer: userMap[order.buyerId] || { id: order.buyerId, name: "משתמש", avatar: null },
    seller: userMap[order.sellerId] || { id: order.sellerId, name: "משתמש", avatar: null },
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, createOrderSchema);
  if ("error" in result) return result.error;

  const { gigId, tier, slotStart, slotEnd } = result.data;

  const slot = parseSlotIso(slotStart, slotEnd);
  if (!slot || !isTwoHourLocalWindow(slot.start, slot.end)) {
    return NextResponse.json(
      { error: "יש לבחור חלון ביקור של שעתיים" },
      { status: 400 }
    );
  }

  if (slot.start.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "חלון הביקור חייב להיות בעתיד" },
      { status: 400 }
    );
  }

  const { data: gig, status: gigStatus } = await proxyRequest(GIGS_SERVICE, `/gigs/${gigId}`);
  if (gigStatus !== 200 || !gig) {
    return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  }

  const pricingTier = gig.tiers?.find((t: { tier: string }) => t.tier === tier);
  if (!pricingTier) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data: availability } = await proxyRequest(
    USERS_SERVICE,
    `/availability/${gig.sellerId}`
  );

  if (!availability || availability.error) {
    return NextResponse.json(
      { error: "לא ניתן לבדוק את הזמינות של האבא" },
      { status: 400 }
    );
  }

  if (availability.acceptingJobs === false) {
    return NextResponse.json(
      { error: "האבא לא מקבל עבודות השבוע" },
      { status: 400 }
    );
  }

  if (
    !slotFitsSchedule(
      slot.start,
      slot.end,
      availability.weeklyHours || [],
      availability.timeOff || []
    )
  ) {
    return NextResponse.json(
      { error: "החלון שבחרת מחוץ לשעות הזמינות" },
      { status: 400 }
    );
  }

  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/orders", {
    method: "POST",
    body: {
      gigId,
      sellerId: gig.sellerId,
      tier,
      price: pricingTier.price,
      slotStart: slot.start.toISOString(),
      slotEnd: slot.end.toISOString(),
    },
    user,
  });

  if (status === 409) {
    return NextResponse.json(
      { error: "החלון תפוס, בחר זמן אחר" },
      { status: 409 }
    );
  }

  return NextResponse.json(data, { status });
}
