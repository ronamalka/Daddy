# `src/` — Next.js application

This folder is the public website and the API gateway.

- `app/` — pages (HTML routes) and `/api/*` handlers
- `components/` — React UI used on many pages
- `lib/` — helpers for auth, time slots, security, and calling microservices
- `store/` — small client state (Zustand)
- `middleware.ts` — rate limits and CSRF checks on every matching request
- `generated/` — Prisma client (do not edit by hand)

The app never lets the browser talk to a microservice directly. Page and API code call `proxyRequest()` in `lib/gateway.ts`.
