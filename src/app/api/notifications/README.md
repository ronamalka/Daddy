# `notifications/`

`GET /api/notifications` — header-bell feed: persisted nearby-request matches plus derived order and chat alerts.

`POST /api/notifications/mark-read` — persist `readAt` for nearby-request rows. Event type `NEW_NEARBY_REQUEST` is reserved for WhatsApp (#52); this path does not send WhatsApp.
