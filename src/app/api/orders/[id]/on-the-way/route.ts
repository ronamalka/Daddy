import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE } from "@/lib/gateway";

/** Seller marks "I'm on my way" -- proxies a PATCH with ON_THE_WAY status. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let eta: string | undefined;
  try {
    const body = await request.json();
    if (typeof body.eta === "string" && body.eta.trim()) {
      eta = body.eta.trim();
    }
  } catch {
    // empty body is fine -- eta is optional
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, `/orders/${id}`, {
    method: "PATCH",
    body: { status: "ON_THE_WAY", ...(eta ? { eta } : {}) },
    user,
  });
  return NextResponse.json(data, { status });
}
