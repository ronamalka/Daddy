# `src/app/` — routes

Next.js App Router. Folders with parentheses are **route groups**: they organise files but do not change the URL.

| Folder | URL role |
| --- | --- |
| `(auth)/` | Login, register, password reset (no main navbar) |
| `(main)/` | The rest of the public site (home, gigs, orders, legal pages) |
| `api/` | JSON API that the browser calls |

Other files:

- `layout.tsx` — root HTML, Hebrew font, session, cookies, accessibility toolbar
- `globals.css` — colours, RTL, and shared styles
- `sitemap.ts` / `robots.ts` / `manifest.ts` — SEO and PWA metadata
- `not-found.tsx` — 404 page
