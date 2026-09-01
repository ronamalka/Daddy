# `[id]/`

`GET /api/orders/:id` — one order with related gig/user data. If the order came from a service request, the assigned seller (or admin) also gets `visit` (street, city, floor) for Waze.  
`PATCH /api/orders/:id` — update status (`IN_PROGRESS`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `REVISION`). Marking `DELIVERED` requires `photos` (1–6 `/uploads/...` image URLs) and an optional `note`. Buyer cancel from `PENDING` is free until 24h before the slot; later it records a fee (one hour or ₪50). After `IN_PROGRESS` the buyer cannot cancel — they open a dispute.

Disputes: nested `dispute/`.  
Materials vs labor: nested `materials/`.
