import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, REQUESTS_SERVICE, USERS_SERVICE } from "@/lib/gateway";

type Person = { id: string; name: string; avatar?: string | null };

/** Loads a user's public name and avatar, or a fallback if the lookup fails. */
async function loadPerson(id: string): Promise<Person> {
  const { data } = await proxyRequest(USERS_SERVICE, `/sellers/${id}`);
  if (data?.id && typeof data.name === "string") {
    return { id: data.id, name: data.name, avatar: data.avatar ?? null };
  }
  return { id, name: "משתמש", avatar: null };
}

/** Adds buyer and seller names to a service request and its quote replies. */
async function enrichRequest(request: {
  buyerId: string;
  responses?: { sellerId: string }[];
}) {
  const sellerIds = [...new Set((request.responses || []).map((row) => row.sellerId))];
  const [buyer, ...sellers] = await Promise.all([
    loadPerson(request.buyerId),
    ...sellerIds.map((id) => loadPerson(id)),
  ]);
  const sellerMap = Object.fromEntries(sellers.map((s) => [s.id, s]));
  return {
    ...request,
    buyer,
    responses: (request.responses || []).map((row) => ({
      ...row,
      seller: sellerMap[row.sellerId] || { id: row.sellerId, name: "משתמש" },
    })),
  };
}

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

/** Returns one service request with buyer and seller names filled in. */
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
  return NextResponse.json({ request: await enrichRequest(data.request) }, { status });
}
