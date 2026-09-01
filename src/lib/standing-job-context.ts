import { proxyRequest, ORDERS_SERVICE, USERS_SERVICE } from "@/lib/gateway";
import {
  bookableOccurrences,
  planOccurrences,
  serializePlannedOccurrence,
  standingPriceFromService,
  type StandingFrequency,
  STANDING_HORIZON,
} from "@/lib/standing-job";
import { getServiceBySlug } from "@/lib/services";
import type { BookedSlot, TimeOffDate, WeeklyHours } from "@/lib/availability";
import type { QuotePriceInput } from "@/lib/quote-price";

type SellerPriceRow = QuotePriceInput & { serviceSlug: string };

export type StandingContext = {
  weeklyHours: WeeklyHours[];
  timeOff: TimeOffDate[];
  bookedSlots: BookedSlot[];
  acceptingJobs: boolean;
  availabilityError: { error: string; status: number } | null;
  price: ReturnType<typeof standingPriceFromService>;
  title: string;
};

/** Loads hours, time-off, bookings, and the current ServicePrice for a daddy + service. */
export async function loadStandingContext(opts: {
  sellerId: string;
  serviceSlug: string;
  title?: string;
  bookedTo?: Date;
}): Promise<StandingContext> {
  const from = new Date();
  const to = opts.bookedTo ?? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  const [availabilityRes, bookedRes, sellerRes] = await Promise.all([
    proxyRequest(USERS_SERVICE, `/availability/${opts.sellerId}`),
    proxyRequest(
      ORDERS_SERVICE,
      `/orders/booked-slots/${opts.sellerId}?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`
    ),
    proxyRequest(USERS_SERVICE, `/sellers/${opts.sellerId}`),
  ]);

  const weeklyHours: WeeklyHours[] = Array.isArray(availabilityRes.data?.weeklyHours)
    ? availabilityRes.data.weeklyHours
    : [];
  const timeOff: TimeOffDate[] = Array.isArray(availabilityRes.data?.timeOff)
    ? availabilityRes.data.timeOff
    : [];
  const bookedSlots: BookedSlot[] = Array.isArray(bookedRes.data) ? bookedRes.data : [];
  const prices: SellerPriceRow[] = Array.isArray(sellerRes.data?.servicePrices)
    ? sellerRes.data.servicePrices
    : [];
  const listed = prices.find((row) => row.serviceSlug === opts.serviceSlug);
  const price = standingPriceFromService(listed);
  const title =
    opts.title?.trim() || getServiceBySlug(opts.serviceSlug)?.nameHe || opts.serviceSlug;
  const acceptingJobs = availabilityRes.data?.acceptingJobs !== false;
  let availabilityError: StandingContext["availabilityError"] = null;
  if (!availabilityRes.data || availabilityRes.data.error) {
    availabilityError = { error: "לא ניתן לבדוק את הזמינות של האבא", status: 400 };
  } else if (acceptingJobs === false) {
    availabilityError = { error: "האבא לא מקבל עבודות השבוע", status: 400 };
  }

  return {
    weeklyHours,
    timeOff,
    bookedSlots,
    acceptingJobs,
    availabilityError,
    price,
    title,
  };
}

/** Preview upcoming visits against hours, time-off, and current catalog price. */
export function buildStandingPreview(opts: {
  frequency: StandingFrequency;
  weekday: number;
  startMin: number;
  after: Date;
  ctx: StandingContext;
  firstSlot?: { start: Date; end: Date };
}) {
  const planned = planOccurrences({
    frequency: opts.frequency,
    weekday: opts.weekday,
    startMin: opts.startMin,
    after: opts.after,
    weeklyHours: opts.ctx.weeklyHours,
    timeOff: opts.ctx.timeOff,
    bookedSlots: opts.ctx.bookedSlots,
    firstSlot: opts.firstSlot,
  });
  const bookable = bookableOccurrences(planned);
  return {
    title: opts.ctx.title,
    price: opts.ctx.price,
    chargeNote: "כל ביקור מחויב בנפרד לפי המחירון בזמן יצירת ההזמנה. אין חיוב אחד על כל הסדרה.",
    occurrences: planned.map(serializePlannedOccurrence),
    bookableCount: bookable.length,
    horizon: STANDING_HORIZON,
  };
}

export type AuthUser = { id: string; email: string; name: string; role: string };
