import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  const user = session?.user as { id: string; email: string; name: string; role: string } | undefined;

  const { data, status } = await proxyRequest(GIGS_SERVICE, `/gigs/${id}`, { user });

  if (status !== 200 || !data) {
    const fallback =
      status === 502
        ? { error: "Service unavailable" }
        : status === 429
          ? { error: "Too many requests" }
          : { error: "Not found" };
    return NextResponse.json(data ?? fallback, { status: status === 502 ? 503 : status });
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

  if (Array.isArray(data.reviews) && data.reviews.length > 0) {
    const reviewerIds = [...new Set(
      data.reviews
        .map((review: { userId?: string }) => review.userId)
        .filter((id: string | undefined): id is string => typeof id === "string" && id.length > 0)
    )];
    const reviewerMap: Record<string, { name: string; avatar: string | null }> = {};
    await Promise.all(
      reviewerIds.map(async (userId) => {
        const { data: reviewer } = await proxyRequest(USERS_SERVICE, `/sellers/${userId}`);
        if (reviewer?.id && typeof reviewer.name === "string") {
          reviewerMap[userId] = { name: reviewer.name, avatar: reviewer.avatar ?? null };
        }
      })
    );
    data.reviews = data.reviews.map((review: { userId?: string }) => ({
      ...review,
      user: (review.userId && reviewerMap[review.userId]) || { name: "משתמש", avatar: null },
    }));
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
