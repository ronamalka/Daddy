# `routes/` — users HTTP handlers

| File | URLs |
| --- | --- |
| `login.ts` | `POST /login` |
| `register.ts` | `POST /register` |
| `oauth.ts` | `POST /oauth` (Google user upsert) |
| `password-reset.ts` | Reset request and confirm |
| `profile.ts` | Current user profile, readiness, become-seller |
| `admin.ts` | Admin user list, suspend, unsuspend |
| `providers.ts` | Search helpers |
| `sellers.ts` | Public seller profile |
| `featured.ts` | Homepage featured helpers |
| `availability.ts` | Weekly hours and time off |
| `service-areas.ts` | Coverage cities |
| `service-prices.ts` | Prices per service |
| `user-services.ts` | Offered service slugs and per-service alert mute |
| `notifications.ts` | Persisted alerts; match nearby requests |
| `locations.ts` | City/district lookup from the local catalog |
