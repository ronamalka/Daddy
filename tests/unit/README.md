# `tests/unit/`

Vitest files that test one module. Names match the helper, for example `availability.test.ts` tests `src/lib/availability.ts`.

Also covers chat rules, gateway signing, rate limits, password policy, seller slot checks, daddy onboarding readiness (`seller-ready.test.ts`: checklist completeness and searchable-seller filters), nearby-request matching (`request-match.test.ts`), the notification feed, disputes, order status updates, the admin moderation queue, the 1–10 review contract (`review-ratings.test.ts`, `review-route.test.ts`), and technical SEO helpers (`seo.test.ts`: sitemap payload parsing, metadata, JSON-LD).
