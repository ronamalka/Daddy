# `[id]/`

`GET /api/orders/:id` — one order with related gig/user data.  
`PATCH /api/orders/:id` — update status (`IN_PROGRESS`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `REVISION`). Buyer cancel from `PENDING` is free until 24h before the slot; later it records a fee (one hour or ₪50). After `IN_PROGRESS` the buyer cannot cancel — they open a dispute.

Disputes: nested `dispute/`.
