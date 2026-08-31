# `e2e/` — Playwright tests

These tests run a real browser against the running app.

| File | What it covers |
| --- | --- |
| `auth.spec.ts` | Login and related screens |
| `gigs.spec.ts` | Gig listing and detail |
| `orders.spec.ts` | Orders list and booking flow |
| `disputes.spec.ts` | Buyer opens a dispute from the order page |
| `admin.spec.ts` | Admin moderation queue |
| `pages.spec.ts` | Public marketing and legal pages |
| `onboarding.spec.ts` | Daddy onboarding until searchable: become-a-daddy CTAs, seller register + independent-contractor checkbox, profile progress meter, featured/search hide incomplete sellers |
| `login.ts` | Shared seeded-account login helper |
| `cookies.ts` | Helper that dismisses the cookie banner so clicks work |

Run: `npm run test:e2e`. Headed (see the browser): `npm run test:e2e:headed`.
