# `prisma/` — Next.js database schema

This schema is for the Next.js process (`src/generated/prisma`). The five microservices each have their own schema under `services/<name>/prisma/`.

- `schema.prisma` — models (users, gigs, orders, messages, and related tables). `Review.gigId` is optional; `Review.sellerId` identifies the daddy on local jobs. `ServiceRequest.unlisted` hides a post from the public teaser only. `ServiceRequest` stores optional street, floor, preferred window (morning / afternoon / weekend), and up to four photo URLs; street is redacted for sellers until a quote is accepted. `Order.cancellationFee` / `cancellationFeeStatus` record a late-cancel obligation before escrow exists. `StandingJob` is a repeating local visit with the same daddy; each occurrence is an `Order` priced from `ServicePrice` at generation time.
- `seed.ts` — demo rows if you seed from the BFF

Generate the client: `npx prisma generate`.
