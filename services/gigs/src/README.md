# `src/` — gigs service source

`index.ts` mounts `/gigs`, `/favorites`, `/reviews`, and `/recent-reviews`.

`lib/review-ratings.ts` is the 1–10 contract and the one-time 1–5 / `sellerId` backfill used by seed.
