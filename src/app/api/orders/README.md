# `orders/`

Bookings.

| Path | Methods | Purpose |
| --- | --- | --- |
| `/api/orders` | GET, POST | List / create (gig or local job). Seller list rows include `visit` when the job has a request address. |
| `/api/orders/[id]` | GET, PATCH | Detail / status (deliver requires 1–6 photos; buyer cancel records a late fee when inside 24h) |
| `/api/orders/[id]/messages` | POST | Message on this order |
| `/api/orders/[id]/requirements` | POST | Extra notes |
| `/api/orders/[id]/review` | POST | Leave a 1–10 review (package or local job) |
| `/api/orders/[id]/dispute` | GET, POST | List / open a dispute |
| `/api/orders/[id]/materials` | POST | One-time materials estimate + buyer ack |
