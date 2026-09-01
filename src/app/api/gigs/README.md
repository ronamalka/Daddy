# `gigs/`

Gig listing API.

| Path | Methods | Purpose |
| --- | --- | --- |
| `/api/gigs` | GET, POST | Search / create (`categoryId` is a local catalog slug; create is limited to the seller's price list) |
| `/api/gigs/[id]` | GET, PUT | One gig |
| `/api/gigs/[id]/related` | GET | Similar gigs |
