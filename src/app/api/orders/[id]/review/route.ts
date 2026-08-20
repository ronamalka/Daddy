import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, GIGS_SERVICE, ORDERS_SERVICE } from "@/lib/gateway";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { detectBot } from "@/lib/bot-detection";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };

  const { data: order, status: orderStatus } = await proxyRequest(ORDERS_SERVICE, `/orders/${orderId}`, { user });

  if (orderStatus !== 200) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.buyerId !== user.id) {
    return NextResponse.json({ error: "Only the buyer can review" }, { status: 403 });
  }

  if (order.status !== "COMPLETED") {
    return NextResponse.json({ error: "Order must be completed" }, { status: 400 });
  }

  const body = await request.json();

  const botCheck = detectBot({
    honeypot: body._hp_field,
    formLoadedAt: body._formLoadedAt,
    headers: request.headers,
  });

  if (botCheck.isBot) {
    console.warn(`[bot-detection] Review blocked: ${botCheck.reason}`);
    return NextResponse.json(
      { error: "הבקשה נחסמה. נסה שוב." },
      { status: 400 }
    );
  }

  if (body.turnstileToken) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
    const valid = await verifyTurnstileToken(body.turnstileToken, ip);
    if (!valid) {
      return NextResponse.json(
        { error: "אימות CAPTCHA נכשל. נסה שוב." },
        { status: 400 }
      );
    }
  } else if (process.env.TURNSTILE_SECRET_KEY) {
    return NextResponse.json(
      { error: "אימות CAPTCHA חסר." },
      { status: 400 }
    );
  }

  const { comment, ratingAttitude, ratingTimeliness, ratingPrice, ratingQuality } = body;

  if (!comment?.trim()) {
    return NextResponse.json({ error: "Comment is required" }, { status: 400 });
  }

  const attitude = Number(ratingAttitude);
  const timeliness = Number(ratingTimeliness);
  const price = Number(ratingPrice);
  const quality = Number(ratingQuality);

  if ([attitude, timeliness, price, quality].some((v) => !v || v < 1 || v > 10)) {
    return NextResponse.json({ error: "All ratings must be between 1 and 10" }, { status: 400 });
  }

  const overall = Math.round((attitude + timeliness + price + quality) / 4);

  const { data, status } = await proxyRequest(GIGS_SERVICE, "/reviews", {
    method: "POST",
    body: {
      orderId,
      gigId: order.gigId,
      rating: overall,
      comment,
      ratingAttitude: attitude,
      ratingTimeliness: timeliness,
      ratingPrice: price,
      ratingQuality: quality,
    },
    user,
  });

  return NextResponse.json(data, { status });
}
