import { describe, it, expect } from "vitest";
import { attachReviewAuthors, reviewAuthor } from "@/lib/review-users";

describe("reviewAuthor", () => {
  it("uses the lookup when the reviewer is known", () => {
    expect(
      reviewAuthor("buyer-1", {
        "buyer-1": { id: "buyer-1", name: "דנה", avatar: null },
      })
    ).toEqual({ id: "buyer-1", name: "דנה", avatar: null });
  });

  it("falls back when the gigs service only sent userId", () => {
    expect(reviewAuthor("buyer-missing", {})).toEqual({
      id: "buyer-missing",
      name: "משתמש",
      avatar: null,
    });
  });

  it("falls back when userId is missing", () => {
    expect(reviewAuthor(undefined, {})).toEqual({
      id: "unknown",
      name: "משתמש",
      avatar: null,
    });
  });
});

describe("attachReviewAuthors", () => {
  it("attaches user so the gig page can render reviewer names", () => {
    const reviews = [
      { id: "rev-1", userId: "buyer-1", comment: "מעולה" },
      { id: "rev-2", userId: "ghost", comment: "גם" },
    ];
    const attached = attachReviewAuthors(reviews, {
      "buyer-1": { id: "buyer-1", name: "דנה", avatar: "/a.png" },
    });
    expect(attached[0].user.name).toBe("דנה");
    expect(attached[1].user.name).toBe("משתמש");
  });
});
