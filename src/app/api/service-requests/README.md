# `service-requests/`

Local job requests (requests service).

| Path | Methods | Purpose |
| --- | --- | --- |
| `/api/service-requests` | GET, POST | List (auth, role-filtered) / create (then match nearby daddies; `unlisted` omits from the public teaser) |
| `/api/service-requests/teaser` | GET | Public cacheable list of recent OPEN listed requests (no street, photos, buyer, or description) |
| `/api/service-requests/[id]/respond` | GET, POST | Quotes |
| `/api/service-requests/[id]/accept` | POST | Buyer accepts a quote |
