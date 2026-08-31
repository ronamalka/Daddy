# `gigs/` — listings service (port 4002)

Packages (price tiers), favorites, and reviews. Public browse of people + prices lives on the website homepage, not here.

## Category migration (issue #94)

Gig `Category.slug` values are the **8 local catalog slugs** from `services/shared/services.ts` (`assembly-and-installation`, `home-maintenance`, …). Seed calls `syncLocalGigCategories()` which:

1. Upserts those 8 rows
2. Remaps leftover Fiverr-style slugs (`car-transport` → `car-and-errands`, `garden-yard` → `garden-and-outdoor`, `moving-lifting` → `moving-and-organization`, `negotiation-bureaucracy` → `admin-and-bureaucracy`, `consulting-training` → `home-maintenance`)
3. Moves assembly seed gigs onto `assembly-and-installation`
4. Deletes unused legacy category rows

Re-seed is enough for existing demo data. Custom rows on a retired slug are remapped by (2); if a slug is unknown they stay until moved by hand.

- `src/routes/gigs.ts` — list and create
- `src/routes/gig-detail.ts` — one gig, update, related
- `src/routes/favorites.ts` — saved gigs
- `src/routes/reviews.ts` — create, flag, respond, admin queue
- `src/routes/recent-reviews.ts` — homepage feed
