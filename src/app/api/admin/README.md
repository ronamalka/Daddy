# `admin/`

Admin-only JSON endpoints.

| Path | Methods | Purpose |
| --- | --- | --- |
| `/api/admin/users` | GET | List users |
| `/api/admin/users/[id]/suspend` | POST | Suspend an account |
| `/api/admin/users/[id]/unsuspend` | POST | Lift a suspension |
| `/api/admin/queue` | GET | Disputes + review flags |
| `/api/admin/disputes/[id]` | PATCH | Resolve a dispute |
| `/api/admin/flags/[id]` | PATCH | Dismiss or hide a flagged review |
| `/api/admin/stats` | GET | Platform counts |
| `/api/admin/lockouts` | GET, POST | See locked accounts; unlock one |
