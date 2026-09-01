# `tests/unit/`

Vitest files that test one module. Names match the helper, for example `availability.test.ts` tests `src/lib/availability.ts`.

Also covers chat rules, gateway signing, rate limits, password policy, seller slot checks, daddy onboarding readiness (`seller-ready.test.ts`: checklist completeness and searchable-seller filters), nearby-request matching (`request-match.test.ts`), the notification feed, disputes, buyer cancellation windows (`cancellation.test.ts`: 24h free cutoff, late fee of one hour or ₪50, recorded obligation, no unilateral cancel after work starts), order status updates, completion photos on mark-delivered (`delivery-photos.test.ts`), the admin moderation queue, the 1–10 review contract (`review-ratings.test.ts`, `review-route.test.ts`), the public request teaser allowlist (`request-teaser.test.ts`), request photos/street/floor/time-of-day (`request-details.test.ts`), and technical SEO helpers (`seo.test.ts`: sitemap payload parsing, metadata, JSON-LD).
