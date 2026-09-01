import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, REQUESTS_SERVICE } from "@/lib/gateway";
import { enrichRequestWithQuoteSellers } from "@/lib/enrich-request-quotes";

/** Lets a seller send a quote on a service request. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(REQUESTS_SERVICE, `/service-requests/${id}/respond`, {
    method: "POST",
    body,
    user,
  });
  return NextResponse.json(data, { status });
}

/** Returns one service request with buyer names, ratings, and area overlap on each quote. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(REQUESTS_SERVICE, `/service-requests/${id}`, { user });
  if (status !== 200 || !data?.request) {
    return NextResponse.json(data ?? { error: "Request not found" }, { status });
  }
  return NextResponse.json({ request: await enrichRequestWithQuoteSellers(data.request) }, { status });
}
