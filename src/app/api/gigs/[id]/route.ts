import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import { attachReviewAuthors, type ReviewUserLookup } from "@/lib/review-users";

/** Returns one gig with seller profile and reviewer names attached. */
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

  const reviews = Array.isArray(data.reviews) ? data.reviews : [];
  const userIds = [...new Set(
    [data.sellerId, ...reviews.map((r: { userId?: string }) => r.userId)].filter(
      (uid): uid is string => typeof uid === "string" && uid.length > 0
    )
  )];

  const profiles: Record<string, ReviewUserLookup & {
    bio: string | null;
    city: string | null;
    createdAt: string;
  }> = {};
  await Promise.all(
    userIds.map(async (uid) => {
      const { data: profile } = await proxyRequest(USERS_SERVICE, `/sellers/${uid}`);
      if (profile?.id && typeof profile.name === "string") {
        profiles[uid] = {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar ?? null,
          bio: profile.bio ?? null,
          city: profile.city ?? null,
          createdAt: profile.createdAt,
        };
      }
    })
  );

  if (data.sellerId && profiles[data.sellerId]) {
    data.seller = profiles[data.sellerId];
  }

  data.reviews = attachReviewAuthors(reviews, profiles);
  data.faqs = Array.isArray(data.faqs) ? data.faqs : [];
  data.requirements = Array.isArray(data.requirements) ? data.requirements : [];
  data.images = Array.isArray(data.images) ? data.images : [];
  if (typeof data.avgRating !== "number" || Number.isNaN(data.avgRating)) {
    data.avgRating = 0;
  }
  if (typeof data.reviewCount !== "number") {
    data.reviewCount = reviews.length;
  }

  return NextResponse.json(data, { status });
}

/** Updates an existing gig. Requires a signed-in user who owns it. */
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
