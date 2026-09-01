# `users/` — accounts service (port 4001)

Stores users, login, OAuth, profiles, availability, locations, nearby-request notifications, and admin user lists. Israeli cities live in `City` (bootstrapped from `src/data/israeli-cities.json`, refreshed daily from data.gov.il in the background).

- `src/index.ts` — Express app
- `src/routes/` — one file per URL group
- `src/seed.ts` — demo users
- `prisma/` — schema for `daddy_users`
