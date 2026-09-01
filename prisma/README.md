# `prisma/` — Next.js database schema

This schema is for the Next.js process (`src/generated/prisma`). The five microservices each have their own schema under `services/<name>/prisma/`.

- `schema.prisma` — models (users, gigs, orders, messages, and related tables). `Review.gigId` is optional; `Review.sellerId` identifies the daddy on local jobs. `ServiceRequest.unlisted` hides a post from the public teaser only. `Order.cancellationFee` / `cancellationFeeStatus` record a late-cancel obligation before escrow exists.
- `seed.ts` — demo rows if you seed from the BFF

Generate the client: `npx prisma generate`.
