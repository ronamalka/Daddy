# `messages/`

Direct chat via the chat service.

| Path | Methods | Purpose |
| --- | --- | --- |
| `/api/messages` | GET, POST | Thread or send (optional `attachment` = `/uploads/{uuid}.{jpg\|png\|webp\|pdf}`) |
| `/api/messages/conversations` | GET | Inbox list |
| `/api/messages/unread-count` | GET | Badge number |
| `/api/messages/mark-read` | POST | Mark a thread read |
