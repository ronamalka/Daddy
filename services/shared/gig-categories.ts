import { SERVICE_CATEGORIES, LEGACY_GIG_CATEGORY_MAP } from "./services";

/** Seed gigs that belong in a tighter local group than the legacy slug mapping. */
export const GIG_CATEGORY_OVERRIDES: Record<string, string> = {
  "seed-gig-ikea": "assembly-and-installation",
  "seed-gig-handyman": "assembly-and-installation",
  "seed-gig-moshe-assembly": "assembly-and-installation",
};

interface CategoryRow {
  id: string;
  slug: string;
}

interface GigCategoryDb {
  category: {
    upsert: (args: {
      where: { slug: string };
      update: { name: string };
      create: { slug: string; name: string };
    }) => Promise<CategoryRow>;
    findUnique: (args: { where: { slug: string } }) => Promise<CategoryRow | null>;
    findMany: (args: { where: { slug: { notIn: string[] } } }) => Promise<CategoryRow[]>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
  gig: {
    updateMany: (args: { where: { categoryId: string }; data: { categoryId: string } }) => Promise<unknown>;
    update: (args: { where: { id: string }; data: { categoryId: string } }) => Promise<unknown>;
    count: (args: { where: { categoryId: string } }) => Promise<number>;
  };
}

/**
 * Upserts the 8 local catalog categories, remaps leftover Fiverr-style gig rows,
 * then deletes unused legacy category rows. Safe to run on every seed.
 */
export async function syncLocalGigCategories(prisma: GigCategoryDb): Promise<void> {
  for (const cat of SERVICE_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.nameHe },
      create: { slug: cat.slug, name: cat.nameHe },
    });
  }

  for (const [from, to] of Object.entries(LEGACY_GIG_CATEGORY_MAP)) {
    const oldCat = await prisma.category.findUnique({ where: { slug: from } });
    const newCat = await prisma.category.findUnique({ where: { slug: to } });
    if (oldCat && newCat && oldCat.id !== newCat.id) {
      await prisma.gig.updateMany({
        where: { categoryId: oldCat.id },
        data: { categoryId: newCat.id },
      });
    }
  }

  for (const [gigId, slug] of Object.entries(GIG_CATEGORY_OVERRIDES)) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) continue;
    try {
      await prisma.gig.update({ where: { id: gigId }, data: { categoryId: cat.id } });
    } catch {
      // Seed gig may not exist yet in this database.
    }
  }

  const localSlugs = SERVICE_CATEGORIES.map((c) => c.slug);
  const leftover = await prisma.category.findMany({
    where: { slug: { notIn: localSlugs } },
  });
  for (const cat of leftover) {
    const n = await prisma.gig.count({ where: { categoryId: cat.id } });
    if (n === 0) {
      await prisma.category.delete({ where: { id: cat.id } });
    }
  }
}
