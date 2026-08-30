# `auth/`

NextAuth and extra session tools.

| Path | Purpose |
| --- | --- |
| `/api/auth/[...nextauth]` | Sign-in, sign-out, session, CSRF (Auth.js) |
| `/api/auth/lockout-status` | Whether this email is delayed or locked |
| `/api/auth/revoke-all` | Drop all Redis session ids for this user |
