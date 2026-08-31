export const QUEUE_TYPES = ["DISPUTE", "REVIEW_FLAG", "ID_CHECK"] as const;
export type QueueItemType = (typeof QUEUE_TYPES)[number];

export const FLAG_STATUSES = ["OPEN", "UNDER_REVIEW", "DISMISSED", "RESOLVED"] as const;
export const FLAG_STATUS_LABELS: Record<string, string> = {
  OPEN: "פתוח",
  UNDER_REVIEW: "בטיפול",
  DISMISSED: "נדחה",
  RESOLVED: "טופל",
};

export const QUEUE_TYPE_LABELS: Record<QueueItemType, string> = {
  DISPUTE: "מחלוקת",
  REVIEW_FLAG: "דיווח על ביקורת",
  ID_CHECK: "בדיקת זהות",
};

export interface QueueParty {
  id: string;
  name: string;
}

export interface QueueItem {
  id: string;
  type: QueueItemType;
  status: string;
  createdAt: string;
  title: string;
  reason: string;
  description: string;
  photos: string[];
  orderId?: string;
  orderPrice?: number;
  reviewId?: string;
  reviewComment?: string;
  opener: QueueParty | null;
  counterpart: QueueParty | null;
  subjectUser: QueueParty | null;
}

export interface DisputeQueueSource {
  id: string;
  status: string;
  createdAt: string | Date;
  reason: string;
  description: string;
  photos?: string[] | null;
  orderId: string;
  openerId: string;
  order?: { price: number; buyerId: string; sellerId: string; title?: string | null };
}

export interface FlagQueueSource {
  id: string;
  status: string;
  createdAt: string | Date;
  reason: string;
  userId: string;
  reviewId: string;
  review?: {
    comment: string;
    userId: string;
    gig?: { title?: string | null; sellerId: string };
  };
}

/** True if this queue row is still waiting on a staff decision. */
export function isOpenQueueStatus(type: QueueItemType, status: string): boolean {
  if (type === "ID_CHECK") return status === "OPEN" || status === "UNDER_REVIEW";
  if (type === "REVIEW_FLAG") return status === "OPEN" || status === "UNDER_REVIEW";
  return status === "OPEN" || status === "UNDER_REVIEW";
}

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

function nameOf(id: string, names: Record<string, string>): QueueParty {
  return { id, name: names[id] || "משתמש" };
}

/** Turns a dispute row into a queue card. */
export function disputeToQueueItem(
  dispute: DisputeQueueSource,
  names: Record<string, string>
): QueueItem {
  const buyerId = dispute.order?.buyerId;
  const sellerId = dispute.order?.sellerId;
  const counterpartId =
    dispute.openerId === buyerId ? sellerId : dispute.openerId === sellerId ? buyerId : sellerId;
  return {
    id: dispute.id,
    type: "DISPUTE",
    status: dispute.status,
    createdAt: iso(dispute.createdAt),
    title: dispute.order?.title || "הזמנה",
    reason: dispute.reason,
    description: dispute.description,
    photos: dispute.photos ?? [],
    orderId: dispute.orderId,
    orderPrice: dispute.order?.price,
    opener: nameOf(dispute.openerId, names),
    counterpart: counterpartId ? nameOf(counterpartId, names) : null,
    subjectUser: counterpartId ? nameOf(counterpartId, names) : null,
  };
}

/** Turns a review-flag row into a queue card. */
export function flagToQueueItem(
  flag: FlagQueueSource,
  names: Record<string, string>
): QueueItem {
  const authorId = flag.review?.userId;
  return {
    id: flag.id,
    type: "REVIEW_FLAG",
    status: flag.status,
    createdAt: iso(flag.createdAt),
    title: flag.review?.gig?.title || "ביקורת",
    reason: flag.reason,
    description: flag.review?.comment || "",
    photos: [],
    reviewId: flag.reviewId,
    reviewComment: flag.review?.comment,
    opener: nameOf(flag.userId, names),
    counterpart: authorId ? nameOf(authorId, names) : null,
    subjectUser: authorId ? nameOf(authorId, names) : null,
  };
}

/** Merges disputes and flags, newest first. ID checks are empty until trust onboarding lands. */
export function mergeQueueItems(
  disputes: DisputeQueueSource[],
  flags: FlagQueueSource[],
  names: Record<string, string>
): QueueItem[] {
  const items = [
    ...disputes.map((d) => disputeToQueueItem(d, names)),
    ...flags.map((f) => flagToQueueItem(f, names)),
  ];
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

export type QueueTypeFilter = "ALL" | QueueItemType;
export type QueueStatusFilter = "ALL" | "OPEN" | "CLOSED";

/** Filters the unified queue by type and open/closed. */
export function filterQueueItems(
  items: QueueItem[],
  type: QueueTypeFilter,
  status: QueueStatusFilter
): QueueItem[] {
  return items.filter((item) => {
    if (type !== "ALL" && item.type !== type) return false;
    if (status === "ALL") return true;
    const open = isOpenQueueStatus(item.type, item.status);
    return status === "OPEN" ? open : !open;
  });
}

export const FLAG_ADMIN_ACTIONS = ["review", "dismiss", "hide"] as const;
export type FlagAdminAction = (typeof FLAG_ADMIN_ACTIONS)[number];

export type ResolveFlagResult =
  | { ok: true; status: string; hideReview: boolean }
  | { ok: false; error: string };

/** Maps an admin flag action to status and whether the review should be hidden. */
export function resolveFlagAction(action: string): ResolveFlagResult {
  if (action === "review") return { ok: true, status: "UNDER_REVIEW", hideReview: false };
  if (action === "dismiss") return { ok: true, status: "DISMISSED", hideReview: false };
  if (action === "hide") return { ok: true, status: "RESOLVED", hideReview: true };
  return { ok: false, error: "פעולה לא חוקית" };
}
