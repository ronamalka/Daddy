# `e2e/` — Playwright tests

These tests run a real browser against the running app.

| File | What it covers |
| --- | --- |
| `auth.spec.ts` | Login and related screens |
| `gigs.spec.ts` | Gig listing and detail |
| `orders.spec.ts` | Orders list and booking flow |
| `pages.spec.ts` | Public marketing and legal pages |
| `cookies.ts` | Helper that dismisses the cookie banner so clicks work |

Run: `npm run test:e2e`. Headed (see the browser): `npm run test:e2e:headed`.
