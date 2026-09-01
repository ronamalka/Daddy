# `src/app/` — routes

Next.js App Router. Folders with parentheses are **route groups**: they organise files but do not change the URL.

| Folder | URL role |
| --- | --- |
| `(auth)/` | Login, register, password reset (no main navbar) |
| `(main)/` | The rest of the public site (home, gigs, orders, legal pages) |
| `api/` | JSON API that the browser calls |
| `uploads/` | Serve files saved by `POST /api/upload` |

Other files:

- `layout.tsx` — root HTML, Hebrew font, session, cookies, accessibility toolbar, `generateMetadata`
- `globals.css` — colours, RTL, and shared styles
- `sitemap.ts` / `robots.ts` / `manifest.ts` — public URLs, crawler rules, and PWA name
- `not-found.tsx` — 404 page
