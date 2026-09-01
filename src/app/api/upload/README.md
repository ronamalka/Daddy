# `upload/`

`POST /api/upload` — image or PDF upload with type checks, size limits, and JPEG EXIF removal. Chat attachments and service-request photos must use the returned `/uploads/...` path; remote URLs are rejected. Request photos are images only (JPEG/PNG/WebP), up to four. Opening that path (`GET /uploads/:filename`) is handled by `src/app/uploads/`.
