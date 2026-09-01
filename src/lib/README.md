# `src/lib/` — shared helpers

Small modules used by API routes and pages. Each exported function has a short comment in the file.

| File | Purpose |
| --- | --- |
| `auth.ts` | NextAuth: credentials, Google, JWT session, Redis `jti` |
| `auth-types.ts` | Extra fields on the session (`role`, `weakPassword`) |
| `gateway.ts` | HMAC-signed HTTP calls to microservices |
| `prisma.ts` | Prisma client for the Next.js process |
| `redis.ts` | Shared Redis connection |
| `account-lockout.ts` | Failed-login delay and lock |
| `rate-limit.ts` | Which API paths get a tight or loose limit (public teaser is tighter than other GETs) |
| `csrf.ts` | Browser helper that adds the CSRF header to `fetch` |
| `password-policy.ts` | Password rules and Have I Been Pwned check |
| `availability.ts` | Jerusalem time, two-hour visit slots |
| `order-views.ts` | Split buyer/seller orders and build a month grid |
| `order-status.ts` | Colours and Hebrew labels for order status |
| `order-update.ts` | Zod body for PATCH order status |
| `seller-slot.ts` | Validate a chosen visit window against a seller |
| `gig-create.ts` | Zod body for creating a package from the seller form |
| `gig-category.ts` | Package category must match the daddy's price list |
| `seller-ready.ts` | Daddy onboarding checklist and post-register redirect |
| `user-services.ts` | Parse seller service slugs and alert-mute flags |
| `nearby-request.ts` | After a request is created, ping matching daddies |
| `notification-feed.ts` | Merge persisted alerts with derived order/chat items |
| `review-users.ts` | Attach reviewer names when gigs only store `userId` |
| `review-ratings.ts` | 1–10 scale helpers shared with gigs-service |
| `request-teaser.ts` | Public OPEN-request teaser fields (no street, photos, or buyer) |
| `accept-quote.ts` | Rules for accepting a seller quote |
| `validate.ts` | Parse JSON bodies with Zod |
| `upload-security.ts` | File type checks and EXIF strip |
| `bot-detection.ts` | Honeypot and "submitted too fast" checks |
| `turnstile.ts` | Cloudflare Turnstile verify |
| `security-logger.ts` | JSON security lines to stdout |
| `legal.ts` | Cookie consent and terms version |
| `cancellation.ts` | 24-hour free cancel, late fee (one hour or ₪50), and recorded obligation |
| `site-url.ts` | Public origin for canonical / sitemap / Open Graph |
| `seo.ts` | Per-page metadata, JSON-LD, and sitemap list parsers |
| `disputes.ts` | Who can open a dispute, reasons, and admin payment actions |
| `moderation-queue.ts` | Merge disputes and review flags into one admin list |
| `session-revoke.ts` | Delete Redis session ids for a user |
| `services.ts` | Catalogue of home services and local category slugs |
| `districts.ts` | Israeli district codes |
| `message-validation.ts` | Zod schemas for chat |
| `attachment-url.ts` | Allowlisted `/uploads/...` chat attachment paths and content types |
| `utils.ts` | `cn()` — merge Tailwind classes |
