# `orders/` — bookings service (port 4003)

Creates and updates jobs (from a gig or a local request). Checks visit slots for overlap. Standing jobs live here: each occurrence is a real order.

- `src/lib/slots.ts` — overlap and parse slot strings
- `src/lib/order-list.ts` — Prisma `where` for "my jobs"
- `src/lib/standing-job.ts` — which visits drop on pause/cancel
- `src/routes/orders.ts` — list and create
- `src/routes/order-detail.ts` — get, patch status, requirements
- `src/routes/standing-jobs.ts` — create schedule, list, pause/resume/cancel, fill upcoming visits
