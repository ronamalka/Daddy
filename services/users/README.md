# `users/` — accounts service (port 4001)

Stores users, login, OAuth, profiles, availability, locations, nearby-request notifications, and admin user lists.

- `src/index.ts` — Express app
- `src/routes/` — one file per URL group
- `src/seed.ts` — demo users
- `prisma/` — schema for `daddy_users`
