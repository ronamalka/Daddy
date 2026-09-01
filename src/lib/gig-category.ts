import { proxyRequest, USERS_SERVICE, GIGS_SERVICE } from "@/lib/gateway";
import { canonicalizeCategorySlug, categoriesFromPricedServices } from "@/lib/services";

type AuthUser = { id: string; email: string; name: string; role: string };

type ResolveOk = { slug: string };
type ResolveErr = { error: string; status: number };

/** Picks a local catalog slug the seller is allowed to put on a package. */
export async function resolveAllowedGigCategory(
  user: AuthUser,
  categoryId: string,
  gigId?: string,
): Promise<ResolveOk | ResolveErr> {
  const slug = canonicalizeCategorySlug(categoryId);
  if (!slug) {
    return { error: "קטגוריה לא נמצאה", status: 400 };
  }

  const { data, status } = await proxyRequest(USERS_SERVICE, "/service-prices", { user });
  if (status === 502) {
    return { error: "לא הצלחנו לבדוק את המחירון", status: 503 };
  }
  if (status !== 200 || !Array.isArray(data)) {
    return { error: "לא הצלחנו לבדוק את המחירון", status: 400 };
  }

  const pricedSlugs = data.map((p: { serviceSlug?: string }) => p.serviceSlug).filter(Boolean) as string[];
  const allowed = categoriesFromPricedServices(pricedSlugs).map((c) => c.slug);

  if (allowed.includes(slug)) {
    return { slug };
  }

  if (gigId) {
    const existing = await proxyRequest(GIGS_SERVICE, `/gigs/${gigId}`, { user });
    const currentSlug = existing.data?.category?.slug as string | undefined;
    if (canonicalizeCategorySlug(currentSlug) === slug) {
      return { slug };
    }
  }

  if (allowed.length === 0) {
    return { error: "קודם הגדר מחיר במחירון", status: 400 };
  }

  return { error: "אפשר לבחור רק קטגוריה שמופיעה במחירון שלך", status: 400 };
}
