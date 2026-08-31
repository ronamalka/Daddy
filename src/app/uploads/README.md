# `uploads/`

`GET /uploads/:filename` — serve a file saved by `POST /api/upload`. Requires a signed-in user so both sides of a chat can open the image or PDF. Filename must be `{uuid}.{jpg|jpeg|png|webp|pdf}`.
