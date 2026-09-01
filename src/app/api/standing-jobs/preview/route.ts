import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateBody } from "@/lib/validate";
import { standingJobWriteSchema } from "@/lib/standing-job-api";
import { parseRequiredVisitSlot } from "@/lib/seller-slot";
import { buildStandingPreview, loadStandingContext } from "@/lib/standing-job-context";

/** Shows upcoming visits and the current ServicePrice before the buyer confirms. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string };
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

  const preview = buildStandingPreview({
    frequency: data.frequency,
    weekday: data.weekday,
    startMin: data.startMin,
    after: new Date(),
    ctx,
    firstSlot,
  });

  return NextResponse.json(preview);
}
