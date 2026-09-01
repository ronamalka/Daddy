# `requests/` — local jobs service (port 4004)

Open job posts and seller quotes. Accepting a quote is validated in the BFF (`src/lib/accept-quote.ts`) and then stored here / turned into an order.

- `src/routes/service-requests.ts` — CRUD, respond, accept, public `GET /teaser`
