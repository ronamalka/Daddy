# `orders/`

Bookings.

| Path | Methods | Purpose |
| --- | --- | --- |
| `/api/orders` | GET, POST | List / create (gig or local job) |
| `/api/standing-jobs` | GET, POST | List / create a repeating local job; each visit is its own order |
| `/api/orders/[id]` | GET, PATCH | Detail / status (buyer cancel records a late fee when inside 24h) |
| `/api/orders/[id]/messages` | POST | Message on this order |
| `/api/orders/[id]/requirements` | POST | Extra notes |
| `/api/orders/[id]/review` | POST | Leave a 1–10 review (package or local job) |
| `/api/orders/[id]/dispute` | GET, POST | List / open a dispute |
| `/api/orders/[id]/materials` | POST | One-time materials estimate + buyer ack |
