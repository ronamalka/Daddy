import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { proxyRequest, GIGS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import { validateBody } from "@/lib/validate";

const favoriteSellerSchema = z.object({
  sellerId: z.string().min(1),
}).strict();

interface FavoriteSellerRow {
  id: string;
  userId: string;
  sellerId: string;
  createdAt: string;
}

/** Returns the signed-in user's favorite sellers, enriched with profile data. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(GIGS_SERVICE, "/favorite-sellers", { user });

  if (status !== 200 || !Array.isArray(data)) {
    return NextResponse.json(data ?? { error: "Failed to load favorite sellers" }, { status });
  }

  const sellerIds = data.map((f: FavoriteSellerRow) => f.sellerId);

  const sellerMap: Record<string, { id: string; name: string; avatar: string | null; city: string | null }> = {};
  await Promise.all(
    sellerIds.map(async (id: string) => {
      const { data: seller } = await proxyRequest(USERS_SERVICE, `/sellers/${id}`);
      if (seller?.id && typeof seller.name === "string") {
        sellerMap[id] = {
          id: seller.id,
          name: seller.name,
          avatar: seller.avatar ?? null,
          city: seller.city ?? null,
        };
      }
    })
  );

  const enriched = data
    .map((f: FavoriteSellerRow) => ({
      id: f.id,
      sellerId: f.sellerId,
      createdAt: f.createdAt,
      seller: sellerMap[f.sellerId] ?? null,
    }))
    .filter((f: { seller: unknown }) => f.seller !== null);

  return NextResponse.json(enriched);
}

/** Adds or removes a seller from the signed-in user's favorites. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(request, favoriteSellerSchema);
  if ("error" in result) return result.error;

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(GIGS_SERVICE, "/favorite-sellers", {
    method: "POST",
    body: result.data,
    user,
  });
  return NextResponse.json(data, { status });
}
