import { afterEach, describe, expect, it } from "vitest";
import {
  collectPublicGigs,
  collectPublicSellers,
  gigJsonLd,
  gigsListHasMore,
  gigPageMetadata,
  MARKETING_SITEMAP_ENTRIES,
  pageMetadata,
  parseGigsList,
  parseProvidersList,
  sellerJsonLd,
  sellerPageMetadata,
  serializeJsonLd,
  truncateMeta,
  type GigSeo,
  type SellerSeo,
} from "@/lib/seo";
import { getSiteUrl, siteUrl } from "@/lib/site-url";

const envKeys = ["NEXT_PUBLIC_BASE_URL", "AUTH_URL"] as const;
const envSnapshot = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of envKeys) {
    const value = envSnapshot[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("getSiteUrl", () => {
  it("falls back to localhost when no host env is set", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.AUTH_URL;
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("prefers NEXT_PUBLIC_BASE_URL over AUTH_URL", () => {
    process.env.AUTH_URL = "https://daddy-from-auth.example";
    process.env.NEXT_PUBLIC_BASE_URL = "https://daddy-app-daddy-dev.example/";
    expect(getSiteUrl()).toBe("https://daddy-app-daddy-dev.example");
  });

  it("uses AUTH_URL when NEXT_PUBLIC_BASE_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    process.env.AUTH_URL = "https://daddy-app-daddy-prod.example";
    expect(getSiteUrl()).toBe("https://daddy-app-daddy-prod.example");
  });

  it("joins paths without a double slash on the homepage", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://abale.example";
    expect(siteUrl("/")).toBe("https://abale.example");
    expect(siteUrl("/how-it-works")).toBe("https://abale.example/how-it-works");
  });
});

describe("gigs list payload", () => {
  it("does not treat { gigs, total, hasMore } as an empty array", () => {
    const payload = {
      gigs: [
        { id: "seed-gig-ikea", sellerId: "seed-user-seller1", updatedAt: "2026-01-01T00:00:00.000Z" },
        { id: "seed-gig-tech" },
      ],
      total: 2,
      hasMore: false,
    };
    expect(Array.isArray(payload)).toBe(false);
    expect(parseGigsList(payload).map((g) => g.id)).toEqual(["seed-gig-ikea", "seed-gig-tech"]);
    expect(gigsListHasMore(payload, 50)).toBe(false);
  });

  it("still accepts a raw array for older shapes", () => {
    expect(parseGigsList([{ id: "g1" }, { id: 2 }, null]).map((g) => g.id)).toEqual(["g1"]);
  });

  it("returns an empty list for null or malformed payloads", () => {
    expect(parseGigsList(null)).toEqual([]);
    expect(parseGigsList({ total: 3 })).toEqual([]);
  });

  it("uses hasMore when paginating", () => {
    expect(gigsListHasMore({ gigs: [{ id: "a" }], hasMore: true }, 50)).toBe(true);
    expect(gigsListHasMore([{ id: "a" }, { id: "b" }], 2)).toBe(false);
  });
});

describe("providers list payload", () => {
  it("reads public seller ids from an array", () => {
    expect(parseProvidersList([
      { id: "seed-user-seller1", createdAt: "2026-01-01T00:00:00.000Z" },
      { name: "no-id" },
      { id: "seed-user-seller2" },
    ]).map((s) => s.id)).toEqual(["seed-user-seller1", "seed-user-seller2"]);
  });

  it("ignores a non-array providers payload", () => {
    expect(parseProvidersList({ sellers: [{ id: "x" }] })).toEqual([]);
  });
});

describe("sitemap collectors", () => {
  it("pages gigs until hasMore is false", async () => {
    const pages: Record<string, unknown> = {
      "http://gigs.test/gigs?skip=0&take=50": {
        gigs: Array.from({ length: 50 }, (_, i) => ({ id: `g-${i}` })),
        hasMore: true,
      },
      "http://gigs.test/gigs?skip=50&take=50": {
        gigs: [{ id: "g-50" }],
        hasMore: false,
      },
    };
    const gigs = await collectPublicGigs("http://gigs.test", async (url) => pages[url] ?? null);
    expect(gigs).toHaveLength(51);
    expect(gigs[50]?.id).toBe("g-50");
  });

  it("collects searchable sellers from a providers page", async () => {
    const first = [{ id: "s1" }, { id: "s2" }];
    const sellers = await collectPublicSellers("http://users.test", async () => first);
    expect(sellers.map((s) => s.id)).toEqual(["s1", "s2"]);
  });
});

describe("page metadata", () => {
  it("sets canonical and Open Graph URL for marketing pages", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://daddy-app-daddy-dev.example";
    const meta = pageMetadata({
      title: "איך זה עובד",
      description: "שלושה צעדים",
      path: "/how-it-works",
    });
    expect(meta.title).toBe("איך זה עובד");
    expect(meta.alternates).toEqual({ canonical: "/how-it-works" });
    expect(meta.openGraph?.url).toBe("https://daddy-app-daddy-dev.example/how-it-works");
  });

  it("lists the public marketing paths the sitemap should include", () => {
    expect(MARKETING_SITEMAP_ENTRIES.map((e) => e.path)).toEqual([
      "/",
      "/how-it-works",
      "/become-a-daddy",
      "/about",
      "/services",
      "/accessibility",
      "/terms",
      "/privacy",
      "/guidelines",
    ]);
  });

  it("uses an absolute title for the homepage so the brand is not doubled", () => {
    const meta = pageMetadata({
      title: "אבאל׳ה — אבא תמיד יודע לסדר. גם אם הוא לא שלך.",
      description: "desc",
      path: "/",
      absoluteTitle: true,
    });
    expect(meta.title).toEqual({
      absolute: "אבאל׳ה — אבא תמיד יודע לסדר. גם אם הוא לא שלך.",
    });
  });
});

describe("seller JSON-LD", () => {
  const seller: SellerSeo = {
    id: "seed-user-seller1",
    name: "יוסי הגולדן",
    bio: "אבא של 3, מתקן הכל.",
    city: "תל אביב",
    avatar: "https://example.com/yossi.png",
    userServices: [{ serviceSlug: "furniture-assembly" }],
    avgRating: 9.4,
    totalReviews: 12,
  };

  it("emits Person + LocalBusiness with a 1–10 AggregateRating", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://abale.example";
    const ld = sellerJsonLd(seller);
    expect(ld["@type"]).toEqual(["Person", "LocalBusiness"]);
    expect(ld.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 9.4,
      bestRating: 10,
      worstRating: 1,
      ratingCount: 12,
    });
    expect(ld.url).toBe("https://abale.example/sellers/seed-user-seller1");
  });

  it("omits AggregateRating when there are no reviews", () => {
    const ld = sellerJsonLd({ ...seller, avgRating: 0, totalReviews: 0 });
    expect(ld.aggregateRating).toBeUndefined();
  });

  it("builds a profile title from the daddy's name", () => {
    const meta = sellerPageMetadata(seller);
    expect(meta.title).toBe("יוסי הגולדן");
    expect(meta.alternates).toEqual({ canonical: "/sellers/seed-user-seller1" });
  });
});

describe("gig Service JSON-LD", () => {
  const gig: GigSeo = {
    id: "seed-gig-ikea",
    title: "הרכבת רהיטי איקאה",
    description: "מהקופסה לסלון",
    image: "/uploads/ikea.jpg",
    sellerId: "seed-user-seller1",
    sellerName: "יוסי הגולדן",
    avgRating: 9,
    reviewCount: 5,
    startingPrice: 200,
  };

  it("emits Service with Offer and provider", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://abale.example";
    const ld = gigJsonLd(gig);
    expect(ld["@type"]).toBe("Service");
    expect(ld.offers).toEqual({ "@type": "Offer", price: 200, priceCurrency: "ILS" });
    expect(ld.provider).toEqual({
      "@type": "Person",
      name: "יוסי הגולדן",
      url: "https://abale.example/sellers/seed-user-seller1",
    });
  });

  it("sets the package canonical path", () => {
    const meta = gigPageMetadata(gig);
    expect(meta.title).toBe("הרכבת רהיטי איקאה");
    expect(meta.alternates).toEqual({ canonical: "/gigs/seed-gig-ikea" });
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so user text cannot close the script tag", () => {
    expect(serializeJsonLd({ name: "</script>oops" })).toContain("\\u003c/script>");
  });
});

describe("truncateMeta", () => {
  it("keeps short copy and ellipsizes long copy", () => {
    expect(truncateMeta("  שלום  עולם  ")).toBe("שלום עולם");
    expect(truncateMeta("א".repeat(200), 20).endsWith("…")).toBe(true);
    expect(truncateMeta("א".repeat(200), 20).length).toBe(20);
  });
});
