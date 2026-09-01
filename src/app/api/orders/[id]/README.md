# `[id]/`

`GET /api/orders/:id` — one order with related gig/user data.  
`PATCH /api/orders/:id` — update status (`IN_PROGRESS`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `REVISION`).

Disputes: nested `dispute/`.  
Materials vs labor: nested `materials/`.
