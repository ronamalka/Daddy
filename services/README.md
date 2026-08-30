# `services/` — microservices

Five Express apps. The browser never calls them. The Next.js app does.

| Folder | Port | Database |
| --- | --- | --- |
| [`users/`](users/README.md) | 4001 | `daddy_users` |
| [`gigs/`](gigs/README.md) | 4002 | `daddy_gigs` |
| [`orders/`](orders/README.md) | 4003 | `daddy_orders` |
| [`requests/`](requests/README.md) | 4004 | `daddy_requests` |
| [`chat/`](chat/README.md) | 4005 | `daddy_chat` |
| [`shared/`](shared/README.md) | — | Auth middleware, helmet, service catalogue |

`seed-all.sh` pushes Prisma schemas and loads demo data.

`tsconfig.base.json` is the shared TypeScript config.

Internal requests must send `x-user` and `x-user-signature`. See `shared/middleware.ts`.
