# `src/app/api/` — BFF JSON API

Browser calls these routes. Each handler checks the session (when needed), validates the body, then uses `proxyRequest` to a microservice.

Handlers live in `route.ts` files. Nested folders map to the URL, for example `orders/[id]/review` → `/api/orders/:id/review`.
