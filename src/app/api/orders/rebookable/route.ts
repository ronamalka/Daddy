import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { proxyRequest, ORDERS_SERVICE, USERS_SERVICE } from "@/lib/gateway";

interface RebookableItem {
  sellerId: string;
  lastOrder: {
    id: string;
    title: string | null;
    price: number;
    laborPrice: number | null;
    materialsEstimate: number | null;
    buyerSuppliesMaterials: boolean;
    completedAt: string;
    jobType: string;
  };
  orderCount: number;
}

/** Returns the user's rebookable sellers, enriched with seller names and avatars. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; email: string; name: string; role: string };
  const { data, status } = await proxyRequest(ORDERS_SERVICE, "/orders/rebookable", { user });

  if (status !== 200 || !Array.isArray(data)) {
    return NextResponse.json(data ?? { error: "Failed to load rebookable orders" }, { status });
  }

  // Enrich with seller names from users service
  const sellerIds = [...new Set(data.map((item: RebookableItem) => item.sellerId))];
  const sellerMap: Record<string, { id: string; name: string; avatar: string | null }> = {};

  await Promise.all(
    sellerIds.map(async (id) => {
      const { data: seller } = await proxyRequest(USERS_SERVICE, `/sellers/${id}`);
      if (seller?.id && typeof seller.name === "string") {
        sellerMap[id] = { id: seller.id, name: seller.name, avatar: seller.avatar ?? null };
      }
    })
  );

  const enriched = data.map((item: RebookableItem) => ({
    ...item,
    seller: sellerMap[item.sellerId] || { id: item.sellerId, name: "בעל מקצוע", avatar: null },
  }));

  return NextResponse.json(enriched);
}
