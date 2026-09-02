import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const subscribeSchema = z.object({
  planType: z.literal("BASIC"),
}).strict();

/** Returns the signed-in buyer's active maintenance plan with visits. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/maintenance/my-plan", { user });
  return NextResponse.json(data, { status });
}

/** Subscribes the signed-in buyer to a maintenance plan. Payment is stubbed for MVP. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, subscribeSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/maintenance/subscribe", {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}
