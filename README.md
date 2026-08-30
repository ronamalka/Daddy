# Abale (Daddy)

Abale is an Israeli marketplace that connects people who need help at home with local helpers ("daddies"). Typical jobs include furniture assembly, small repairs, moving help, garden work, and simple tech support.

The public name in Hebrew is **אבאל׳ה**. This repository is named `Daddy`.

## How the project is built

The website is a **Next.js** app. It talks to the browser, checks the user's session, and then calls five small **Express** services. Those services do not sit on the public internet. Only the Next.js app (the BFF — "backend for frontend") is public.

```
Browser  →  Next.js app (:3000)  →  users / gigs / orders / requests / chat
                 │
                 ├── PostgreSQL (one database per service)
                 └── Redis (sessions, login lockout, cache)
```

| Service | Port | Role |
| --- | --- | --- |
| Next.js BFF | 3000 | Website, login, and API gateway |
| users | 4001 | Accounts, profiles, availability, locations |
| gigs | 4002 | Gig listings, reviews, favorites |
| orders | 4003 | Bookings and order status |
| requests | 4004 | Local job requests and quotes |
| chat | 4005 | Direct messages |

Each service has its own PostgreSQL database. The Next.js app signs every internal request with a shared secret so a service can trust the user header.

## Local setup

You need **Node.js 22**, **Docker**, and **npm**.

1. Copy environment values your team uses (`DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, `INTER_SERVICE_SECRET`, service URLs). There is no committed `.env` file.

2. Start Postgres, Redis, and the five services:

```bash
docker compose up --build
```

Postgres is available on `localhost:5432`. The microservices stay on the Docker network. The Next.js app talks to them by URL (for local work, often `http://localhost:4001` and so on).

3. Create tables and demo data:

```bash
./services/seed-all.sh
```

4. Run the website:

```bash
npm install
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js app |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Unit and system tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright) |
| `npm run seed` | Seed the Next.js Prisma schema (if you use it) |

## Main folders

| Folder | What is inside |
| --- | --- |
| [`src/`](src/README.md) | Next.js website, API routes, UI, and helpers |
| [`services/`](services/README.md) | Five Express services and shared code |
| [`prisma/`](prisma/README.md) | Prisma schema used by the Next.js app |
| [`tests/`](tests/README.md) | Fast unit and system tests |
| [`e2e/`](e2e/README.md) | Playwright browser tests |
| [`gitops/`](gitops/README.md) | Kubernetes manifests that Argo CD applies |
| [`openshift/`](openshift/README.md) | Extra cluster files (network policy, TLS notes) |
| [`scripts/`](scripts/README.md) | Backup and cluster helper scripts |
| [`public/`](public/README.md) | Static files (logo, icons) |
| [`.github/`](.github/README.md) | GitHub Actions and Dependabot |

Every source folder has its own `README.md` with a short explanation.

## Security notes (short)

- Login has delay, soft lock, and hard lock after too many failed attempts.
- API writes need a CSRF token. The browser cookie and the `x-csrf-token` header must match.
- Rate limits sit in Next.js middleware. Auth paths are stricter than normal reads.
- File uploads accept JPEG, PNG, and WebP only, and JPEG EXIF data is stripped.
- Passwords must be long enough, mixed, and not from a common-password list.

## Deploy

Code goes **feature branch → `dev` → `stg` → tagged production**. Do not open a normal feature PR against `main`.

CI builds container images, pushes them to Quay, and updates tags in `gitops/`. Argo CD (`daddy-dev` and the other apps) syncs those manifests. Do not change a Deployment image by hand with `oc set image`.

Details: [`gitops/README.md`](gitops/README.md) and [`.github/README.md`](.github/README.md).

## Tests

- **Unit tests** (`tests/unit`) cover helpers such as availability, lockout, and chat rules.
- **System tests** (`tests/system`) cover API behaviour with more of the stack.
- **E2E tests** (`e2e`) click through login, gigs, orders, and pages in a real browser.

## Language of the product

The user interface is Hebrew (RTL). This README and the folder READMEs are written in B2 English so new developers can follow the code.
