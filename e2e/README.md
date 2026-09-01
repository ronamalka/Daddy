# `e2e/` — Playwright tests

These tests run a real browser against the running app.

| File | What it covers |
| --- | --- |
| `auth.spec.ts` | Login and related screens |
| `gigs.spec.ts` | Gig listing and detail |
| `job-loop.spec.ts` | Real marketplace loop in Hebrew: login, post a request (street/floor/preferred window), seller sees photos/floor but not street until accept, seller quote, buyer accept → local job, seller start → deliver, buyer complete → 1–10 review; plus instant-book a slot from the seller price list (the catalog-unification path; `/gigs/:id` checkout is not the public catalog anymore) |
| `quotes-compare.spec.ts` | Buyer compare of two seeded quotes: price/rating sort, area overlap, accept buttons |
| `reviews.spec.ts` | Complete a local job, submit a 1–10 review, see it on the daddy profile |
| `disputes.spec.ts` | Buyer opens a dispute from the order page |
| `admin.spec.ts` | Admin moderation queue |
| `pages.spec.ts` | Public marketing and legal pages, plus the guest request teaser |
| `onboarding.spec.ts` | Daddy onboarding until searchable: become-a-daddy CTAs, seller register + independent-contractor checkbox, profile progress meter, featured/search hide incomplete sellers |
| `login.ts` | Shared seeded-account login helper |
| `cookies.ts` | Helper that dismisses the cookie banner so clicks work |

Run: `npm run test:e2e`. Headed (see the browser): `npm run test:e2e:headed`.
