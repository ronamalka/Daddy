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
| `rate-limit.ts` | Which API paths get a tight or loose limit |
| `csrf.ts` | Browser helper that adds the CSRF header to `fetch` |
| `password-policy.ts` | Password rules and Have I Been Pwned check |
| `availability.ts` | Jerusalem time, two-hour visit slots |
| `order-views.ts` | Split buyer/seller orders and build a month grid |
| `order-status.ts` | Colours and Hebrew labels for order status |
| `seller-slot.ts` | Validate a chosen visit window against a seller |
| `accept-quote.ts` | Rules for accepting a seller quote |
| `validate.ts` | Parse JSON bodies with Zod |
| `upload-security.ts` | File type checks and EXIF strip |
| `bot-detection.ts` | Honeypot and "submitted too fast" checks |
| `turnstile.ts` | Cloudflare Turnstile verify |
| `security-logger.ts` | JSON security lines to stdout |
| `legal.ts` | Cookie consent and terms version |
| `services.ts` | Catalogue of home services |
| `districts.ts` | Israeli district codes |
| `message-validation.ts` | Zod schemas for chat |
| `utils.ts` | `cn()` — merge Tailwind classes |
