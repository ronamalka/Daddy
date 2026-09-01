# `shared/` — code used by every service

| File | Purpose |
| --- | --- |
| `middleware.ts` | Read and check `x-user` + HMAC; `requireAuth` / admin / seller |
| `security.ts` | Helmet, CORS, rate limiters |
| `types.ts` | `AuthUser` and common error shapes |
| `services.ts` | Same service catalogue as the website |
| `gig-categories.ts` | Upsert the 8 local gig categories and remap leftover slugs |
| `districts.ts` | Israeli district names |
| `review-ratings.ts` | 1–10 Midrag scale, overall average, leftover 1–5 detection |
| `request-teaser.ts` | Public teaser shape for OPEN listed requests (no street, photos, or buyer) |

Services import this folder as `../../shared/...`.
