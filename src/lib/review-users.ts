export interface ReviewAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

export interface ReviewUserLookup {
  id: string;
  name: string;
  avatar?: string | null;
}

/** Returns a display author for a review, or a generic name when the user is missing. */
export function reviewAuthor(
  userId: string | undefined,
  users: Record<string, ReviewUserLookup>
): ReviewAuthor {
  const found = userId ? users[userId] : undefined;
  if (found) {
    return { id: found.id, name: found.name, avatar: found.avatar ?? null };
  }
  return { id: userId || "unknown", name: "משתמש", avatar: null };
}

/** Copies reviews and attaches a `user` object from a lookup map. */
export function attachReviewAuthors<T extends { userId?: string }>(
  reviews: T[],
  users: Record<string, ReviewUserLookup>
): (T & { user: ReviewAuthor })[] {
  return reviews.map((review) => ({
    ...review,
    user: reviewAuthor(review.userId, users),
  }));
}
