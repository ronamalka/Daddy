# `service-requests/`

Local job requests (requests service).

| Path | Methods | Purpose |
| --- | --- | --- |
| `/api/service-requests` | GET, POST | List (auth, role-filtered) / create (then match nearby daddies) |
| `/api/service-requests/[id]/respond` | GET, POST | Quotes |
| `/api/service-requests/[id]/accept` | POST | Buyer accepts a quote |
