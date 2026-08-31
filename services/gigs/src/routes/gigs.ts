import { Router, Request, Response } from "express";
import { requireSeller } from "../../../shared/middleware";
import { prisma } from "../index";

/** Routes for listing gigs and creating a new gig. */
export const gigsRoutes = Router();

/** Search and page gigs with filters, sort, and ratings. */
gigsRoutes.get("/", async (req: Request, res: Response) => {
  const search = (req.query.search as string) || "";
  const category = (req.query.category as string) || "";
  const minPrice = parseFloat((req.query.minPrice as string) || "0");
  const maxPrice = parseFloat((req.query.maxPrice as string) || "999999");
  const sortBy = (req.query.sortBy as string) || "newest";
  const sellerId = req.query.sellerId as string | undefined;
  const skip = parseInt((req.query.skip as string) || "0", 10);
  const take = Math.min(parseInt((req.query.take as string) || "12", 10), 50);

  const needsMemorySort = sortBy === "price_asc" || sortBy === "price_desc" || sortBy === "rating";
  const orderBy: Record<string, unknown> =
    sortBy === "popular" ? { reviews: { _count: "desc" } }
    : { createdAt: "desc" };

  const where: Record<string, unknown> = {
    tiers: { some: { price: { gte: minPrice, lte: maxPrice } } },
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) {
    where.category = { slug: category };
  }
  if (sellerId) {
    where.sellerId = sellerId;
  }

  const includeFields = {
    category: true,
    tiers: { orderBy: { price: "asc" as const }, take: 1 },
    reviews: { select: { rating: true } },
    _count: { select: { favorites: true } },
  };

  let allGigs;
  let total: number;

  if (needsMemorySort) {
    allGigs = await prisma.gig.findMany({ where, include: includeFields, orderBy });
    total = allGigs.length;
  } else {
    [allGigs, total] = await Promise.all([
      prisma.gig.findMany({ where, include: includeFields, orderBy, skip, take }),
      prisma.gig.count({ where }),
    ]);
  }

  let gigsWithRating = allGigs.map((gig) => {
    const avgRating =
      gig.reviews.length > 0
        ? gig.reviews.reduce((sum, r) => sum + r.rating, 0) / gig.reviews.length
        : 0;
    return { ...gig, avgRating, reviewCount: gig.reviews.length, favoriteCount: gig._count.favorites };
  });

  if (sortBy === "rating") {
    gigsWithRating.sort((a, b) => b.avgRating - a.avgRating);
  } else if (sortBy === "price_asc") {
    gigsWithRating.sort((a, b) => (a.tiers[0]?.price ?? 0) - (b.tiers[0]?.price ?? 0));
  } else if (sortBy === "price_desc") {
    gigsWithRating.sort((a, b) => (b.tiers[0]?.price ?? 0) - (a.tiers[0]?.price ?? 0));
  }

  if (needsMemorySort) {
    gigsWithRating = gigsWithRating.slice(skip, skip + take);
  }

  res.json({ gigs: gigsWithRating, total, hasMore: skip + take < total });
});

/** Create a new gig with tiers, and optional FAQs and requirements. */
gigsRoutes.post("/", requireSeller, async (req: Request, res: Response) => {
  const { title, description, image, categoryId, tiers, faqs, requirements } = req.body;

  if (!title || !description || !categoryId || !tiers?.length) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  const category = await prisma.category.findFirst({
    where: { OR: [{ id: categoryId }, { slug: categoryId }] },
    select: { id: true },
  });
  if (!category) {
    res.status(400).json({ error: "קטגוריה לא נמצאה" });
    return;
  }

  try {
    const gig = await prisma.gig.create({
      data: {
        title,
        description,
        image: image || null,
        categoryId: category.id,
        sellerId: req.user!.id,
        tiers: {
          create: tiers.map((t: { tier: string; title: string; description: string; price: number; deliveryDays: number; revisions: number }) => ({
            tier: t.tier,
            title: t.title || t.tier,
            description: t.description || "",
            price: t.price,
            deliveryDays: t.deliveryDays,
            revisions: t.revisions ?? 1,
          })),
        },
        ...(faqs?.length && {
          faqs: {
            create: faqs.map((f: { question: string; answer: string }, i: number) => ({
              question: f.question,
              answer: f.answer,
              order: i,
            })),
          },
        }),
        ...(requirements?.length && {
          requirements: {
            create: requirements.map((r: { question: string; required: boolean }, i: number) => ({
              question: r.question,
              required: r.required ?? true,
              order: i,
            })),
          },
        }),
      },
      include: { tiers: true, category: true, faqs: true, requirements: true },
    });

    res.status(201).json(gig);
  } catch {
    res.status(500).json({ error: "יצירת השירות נכשלה" });
  }
});
