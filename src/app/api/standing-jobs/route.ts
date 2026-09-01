import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";
import { standingJobWriteSchema } from "@/lib/standing-job-api";
import { parseRequiredVisitSlot } from "@/lib/seller-slot";
import { bookableOccurrences, occurrenceOrderPayload, planOccurrences } from "@/lib/standing-job";
import { loadStandingContext } from "@/lib/standing-job-context";

/** Lists the signed-in user's standing jobs. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/standing-jobs", { user });
  return NextResponse.json(data, { status });
}

/** Creates a standing job and real per-visit orders at the current ServicePrice. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as { id: string; email: string; name: string; role: string };

  const result = await validateBody(request, standingJobWriteSchema);
  if ("error" in result) return result.error;
  const data = result.data;

  if (data.sellerId === user.id) {
    return NextResponse.json({ error: "לא ניתן להזמין את עצמך" }, { status: 400 });
  }

  let firstSlot: { start: Date; end: Date } | undefined;
  if (data.firstSlotStart && data.firstSlotEnd) {
    const parsed = parseRequiredVisitSlot(data.firstSlotStart, data.firstSlotEnd);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    firstSlot = parsed.slot;
  }

  const ctx = await loadStandingContext({
    sellerId: data.sellerId,
    serviceSlug: data.serviceSlug,
    title: data.title,
  });
  if (ctx.availabilityError) {
    return NextResponse.json({ error: ctx.availabilityError.error }, { status: ctx.availabilityError.status });
  }
  if (!ctx.price) {
    return NextResponse.json({ error: "אין מחיר במחירון לשירות הזה" }, { status: 400 });
  }

  const planned = planOccurrences({
    frequency: data.frequency,
    weekday: data.weekday,
    startMin: data.startMin,
    after: new Date(),
    weeklyHours: ctx.weeklyHours,
    timeOff: ctx.timeOff,
    bookedSlots: ctx.bookedSlots,
    firstSlot,
  });
  const bookable = bookableOccurrences(planned);
  if (bookable.length === 0) {
    return NextResponse.json({ error: "אין חלונות פנויים במחזורים הקרובים" }, { status: 409 });
  }

  const { data: created, status } = await proxyRequest(ORDERS_SERVICE, "/standing-jobs", {
    method: "POST",
    body: {
      sellerId: data.sellerId,
      serviceSlug: data.serviceSlug,
      title: ctx.title,
      frequency: data.frequency,
      weekday: data.weekday,
      startMin: data.startMin,
      sourceOrderId: data.sourceOrderId,
      occurrences: bookable.map((row) => occurrenceOrderPayload(row, ctx.price!)),
    },
    user,
  });

  if (status === 409) {
    return NextResponse.json({ error: "החלונות תפוסים, בחר זמן אחר" }, { status: 409 });
  }

  return NextResponse.json(created, { status });
}
