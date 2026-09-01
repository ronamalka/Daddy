import { proxyRequest, USERS_SERVICE } from "@/lib/gateway";

type SessionUser = { id: string; email: string; name: string; role: string };

type CreatedRequest = {
  id?: string;
  title?: string;
  serviceSlug?: string | null;
  cityCode?: number | null;
  cityName?: string | null;
  districtCode?: number | null;
  districtName?: string | null;
  buyerId?: string;
};

/** Asks the users service to match and persist nearby-request notifications. Failures must not fail create. */
export async function notifyNearbySellers(user: SessionUser, created: CreatedRequest | null | undefined) {
  if (!created?.id) return { notified: 0 };
  const { data, status } = await proxyRequest(USERS_SERVICE, "/notifications/nearby-request", {
    method: "POST",
    body: {
      requestId: created.id,
      title: created.title ?? "",
      serviceSlug: created.serviceSlug ?? null,
      cityCode: created.cityCode ?? null,
      cityName: created.cityName ?? null,
      districtCode: created.districtCode ?? null,
      districtName: created.districtName ?? null,
      buyerId: created.buyerId || user.id,
    },
    user,
  });
  if (status >= 400) {
    console.warn(`[nearby-request] match failed: ${status}`);
    return { notified: 0 };
  }
  const notified = typeof data?.notified === "number" ? data.notified : 0;
  return { notified };
}
