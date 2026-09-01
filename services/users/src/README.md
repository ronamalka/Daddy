# `src/` — users service source

`index.ts` creates Prisma, applies security, and mounts routes. Route files live in `routes/`. `request-match.ts` ranks nearby daddies for a new job request. `city-catalog.ts` serves Israeli cities from Postgres and refreshes data.gov.il once a day in the background. Startup refresh is best-effort: a missing `City` table (CI starts the process before `prisma db push`) is logged and ignored so `/health` stays up.
