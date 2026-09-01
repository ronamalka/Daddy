# `providers/`

`GET /api/providers` — search helpers (users service), then 1–10 averages from gigs-service. Used on home and search views.

Query params:

- `service` — local service slug
- `cityCode` + `district` — city search; includes daddies who listed that city or the whole district
- `minPrice` / `maxPrice` — `ServicePrice` range for the selected service
- `pricing` — `all` (default), `fixed` (has a listed price), or `quote` (takes requests only for this service)
- `sortBy` — `distance` (default when a city is set), `price`, or `rating`
