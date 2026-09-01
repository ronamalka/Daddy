import { proxyRequest, REQUESTS_SERVICE } from "@/lib/gateway";

export type OrderVisit = {
  street: string | null;
  cityName: string | null;
  districtName: string | null;
  floor: string | null;
  streetVisible: boolean;
  hasStreet: boolean;
};

type RequestVisitSource = {
  street?: string | null;
  cityName?: string | null;
  districtName?: string | null;
  floor?: string | null;
  streetVisible?: boolean;
  hasStreet?: boolean;
};

type OrderViewer = {
  id: string;
  role: string;
};

/** Picks the visit-address fields from a service request payload. */
export function visitFromRequest(request: RequestVisitSource | null | undefined): OrderVisit | null {
  if (!request) return null;
  const street = request.street?.trim() || null;
  return {
    street,
    cityName: request.cityName?.trim() || null,
    districtName: request.districtName?.trim() || null,
    floor: request.floor?.trim() || null,
    streetVisible: Boolean(request.streetVisible && street),
    hasStreet: Boolean(request.hasStreet ?? street),
  };
}

/**
 * Job-day address is for the assigned daddy only (admin can still load it).
 * Buyers already see street on the request; other sellers cannot GET the order.
 */
export function visitVisibleToSeller(
  visit: OrderVisit | null,
  viewer: OrderViewer,
  sellerId: string
): OrderVisit | null {
  if (!visit) return null;
  if (viewer.role === "ADMIN" || viewer.id === sellerId) return visit;
  return null;
}

/** Loads a redacted request address for one order, or null if there is no request. */
export async function loadOrderVisit(
  requestId: string | null | undefined,
  user: { id: string; email: string; name: string; role: string }
): Promise<OrderVisit | null> {
  if (!requestId) return null;
  const { data, status } = await proxyRequest(REQUESTS_SERVICE, `/service-requests/${requestId}`, { user });
  if (status !== 200) return null;
  return visitFromRequest(data?.request ?? data);
}

/** Loads visit addresses for many request ids, keyed by request id. */
export async function loadOrderVisits(
  requestIds: Array<string | null | undefined>,
  user: { id: string; email: string; name: string; role: string }
): Promise<Record<string, OrderVisit>> {
  const unique = [...new Set(requestIds.filter((id): id is string => Boolean(id)))];
  const rows = await Promise.all(
    unique.map(async (id) => {
      const visit = await loadOrderVisit(id, user);
      return visit ? ([id, visit] as const) : null;
    })
  );
  return Object.fromEntries(rows.filter((row): row is readonly [string, OrderVisit] => Boolean(row)));
}
