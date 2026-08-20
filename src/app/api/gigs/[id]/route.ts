import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  const user = session?.user as { id: string; email: string; name: string; role: string } | undefined;

  const { data, status } = await proxyRequest(GIGS_SERVICE, `/gigs/${id}`, { user });

  if (status !== 200 || !data) {
    return NextResponse.json(data ?? { error: "Not found" }, { status: status === 502 ? 404 : status });
  }

  if (data.sellerId) {
    const { data: sellerData } = await proxyRequest(USERS_SERVICE, `/sellers/${data.sellerId}`);
    if (sellerData) {
      data.seller = {
        id: sellerData.id,
        name: sellerData.name,
        avatar: sellerData.avatar,
        bio: sellerData.bio,
        city: sellerData.city,
        createdAt: sellerData.createdAt,
      };
    }
  }

  return NextResponse.json(data, { status });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(GIGS_SERVICE, `/gigs/${id}`, {
    method: "PUT",
    body,
    user,
  });
  return NextResponse.json(data, { status });
}
