# `teaser/`

`GET /api/service-requests/teaser` — public, cacheable list of the latest OPEN listed requests.

Returns only `id`, `title`, `serviceSlug`, `cityName`, `districtName`, `createdAt`. No street, phone, photos, buyer name, or description. Unlisted posts are omitted. Rate-limited tighter than other GETs.
