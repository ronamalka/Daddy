# `orders/` — bookings service (port 4003)

Creates and updates jobs (from a gig or a local request). Checks visit slots for overlap.

- `src/lib/slots.ts` — overlap and parse slot strings
- `src/lib/order-list.ts` — Prisma `where` for "my jobs"
- `src/routes/orders.ts` — list and create
- `src/routes/order-detail.ts` — get, patch status, requirements
